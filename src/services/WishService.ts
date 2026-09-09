import { AppDataSource } from '../config/database';
import { Wish } from '../entities/Wish';
import { ShoppingTrip } from '../entities/ShoppingTrip';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { NotificationService } from './NotificationService';

export class WishService {
  private wishRepo = AppDataSource.getRepository(Wish);
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
    const wish = this.wishRepo.create({
      productId,
      createdById,
      status:  'open'
    });

    await this.wishRepo.save(wish);

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
