import { AppDataSource } from '../config/database';
import { Wish } from '../entities/Wish';
import { ShoppingTrip } from '../entities/ShoppingTrip';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { NotificationService } from './NotificationService';
import { ProductService } from './ProductService';

export class WishService {
  private wishRepo = AppDataSource.getRepository(Wish);
  private tripRepo = AppDataSource.getRepository(ShoppingTrip);
  private productService = new ProductService();
  private notificationService = new NotificationService();

  async list(options?: { status?: string; createdById?: string; shopId?: string }) {
    let query = this.wishRepo.createQueryBuilder('wish');

    if (options?.status) {
      query = query.where('wish.status = :status', { status: options.status });
    }

    if (options?.createdById) {
      query = query.andWhere('wish.createdById = :createdById', { createdById: options.createdById });
    }

    if (options?.shopId) {
      query = query
        .leftJoinAndSelect('wish.product', 'product')
        .andWhere('product.preferredShopId = :shopId', { shopId: options.shopId });
    }

    return query.orderBy('wish.createdAt', 'DESC').getMany();
  }

  async getById(id: string) {
    const wish = await this.wishRepo.findOne({ where: { id } });
    if (!wish) throw new NotFoundError('Wish not found');
    return wish;
  }

  async create(productId: string, createdById: string) {
    const product = await this.productService.getById(productId);

    // Check for active trip
    const activeTrip = await this.tripRepo.findOne({
      where: { status: 'active' },
      relations: ['stops', 'stops.shop'],
    });

    let assignedTripStopId: string | undefined;
    let buyer: { id: string } | undefined;

    if (activeTrip && product.preferredShopId) {
    // A trip stays 'active' as long as any of its stops is - so a stop
      // that was already completed via "Fertig hier" is still present in
      // activeTrip.stops. Without the status check here, a new wish for
      // that stop's shop would be auto-assigned to an already-finished
      // stop and get stuck in 'onTrip' forever instead of staying 'open'.
      const matchingStop = activeTrip.stops.find(
        (s) => s.status === 'active' && s.shop.id === product.preferredShopId
      );
      if (matchingStop) {
        assignedTripStopId = matchingStop.id;
        buyer = activeTrip.startedBy;
      }
    }

    const wish = this.wishRepo.create({
      productId,
      createdById,
      status: assignedTripStopId ? 'onTrip' : 'open',
      assignedTripStopId,
    });

    await this.wishRepo.save(wish);

    // Notify creator
    await this.notificationService.create(wish.id, createdById, assignedTripStopId ? 'wishOnTrip' : undefined);

    // Notify buyer if auto-assigned
    if (buyer) {
      await this.notificationService.create(wish.id, buyer.id, 'wishAddedToActiveTrip');
    }

    return wish;
  }

  async retract(id: string, userId: string) {
    const wish = await this.getById(id);
    if (wish.createdById !== userId) throw new ForbiddenError('Not the creator of this wish');

    const wasTripStop = wish.status === 'onTrip';
    wish.status = 'cancelled';
    await this.wishRepo.save(wish);

    if (wasTripStop && wish.assignedTripStop?.trip?.startedBy) {
      await this.notificationService.create(wish.id, wish.assignedTripStop.trip.startedBy.id, 'wishRetracted');
    }
  }
}
