import { AppDataSource } from '../config/database';
import { ShoppingTrip } from '../entities/ShoppingTrip';
import { TripStop } from '../entities/TripStop';
import { Wish } from '../entities/Wish';
import { NotFoundError } from '../utils/errors';
import { NotificationService } from './NotificationService';
import type { CreateTripStopRequest } from '../dto/schemas';

export class TripService {
  private tripRepo = AppDataSource.getRepository(ShoppingTrip);
  private stopRepo = AppDataSource.getRepository(TripStop);
  private wishRepo = AppDataSource.getRepository(Wish);
  private notificationService = new NotificationService();

  async list(status?: string) {
    let query = this.tripRepo.createQueryBuilder('trip');
    if (status) {
      query = query.where('trip.status = :status', { status });
    }
    return query.orderBy('trip.startedAt', 'DESC').getMany();
  }

  async getById(id: string) {
    const trip = await this.tripRepo.findOne({ where: { id }, relations: ['stops', 'stops.wishes'] });
    if (!trip) throw new NotFoundError('Trip not found');
    return trip;
  }

  async create(startedById: string, stops: CreateTripStopRequest[]) {
    return AppDataSource.transaction(async (tm) => {
      const trip = tm.create(ShoppingTrip, {
        startedById,
        status: 'active',
      });
      await tm.save(trip);

      for (const stopData of stops) {
        const stop = tm.create(TripStop, {
          tripId: trip.id,
          shopId: stopData.shopId,
          status: 'active',
        });
        await tm.save(stop);

        for (const wishId of stopData.wishIds || []) {
          const wish = await tm.findOne(Wish, { where: { id: wishId } });
          if (wish) {
            wish.status = 'onTrip';
            wish.assignedTripStopId = stop.id;
            await tm.save(wish);
            await this.notificationService.create(wish.id, wish.createdById, 'wishOnTrip');
          }
        }
      }

      return this.getById(trip.id);
    });
  }

  async completeStop(tripId: string, stopId: string, notFoundWishIds: string[] = []) {
    return AppDataSource.transaction(async (tm) => {
      const stop = await tm.findOne(TripStop, {
        where: { id: stopId },
        relations: ['wishes', 'trip'],
      });
      if (!stop) throw new NotFoundError('Stop not found');

      for (const wish of stop.wishes) {
        if (notFoundWishIds.includes(wish.id)) {
          wish.status = 'open';
          wish.assignedTripStopId = undefined;
          await tm.save(wish);
          await this.notificationService.create(wish.id, wish.createdById, 'wishNotFound');
        } else {
          wish.status = 'purchased';
          await tm.save(wish);
        }
      }

      stop.status = 'done';
      await tm.save(stop);

      const trip = await tm.findOne(ShoppingTrip, {
        where: { id: tripId },
        relations: ['stops'],
      });
      if (trip && trip.stops.every((s) => s.status === 'done')) {
        trip.status = 'done';
        await tm.save(trip);
      }

      return stop;
    });
  }
}
