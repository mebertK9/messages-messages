import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ShoppingTrip } from '../entities/ShoppingTrip';
import { TripStop } from '../entities/TripStop';
import { Wish } from '../entities/Wish';
import { NotFoundError } from '../utils/errors';
import { NotificationService } from './NotificationService';
import type { CreateTripStopRequest } from '../dto/schemas';

export class TripService {
  private tripRepo = AppDataSource.getRepository(ShoppingTrip);
  private notificationService = new NotificationService();

  async list(status?: string) {
    let query = this.tripRepo.createQueryBuilder('trip');
    if (status) {
      query = query.where('trip.status = :status', { status });
    }
    return query.orderBy('trip.startedAt', 'DESC').getMany();
  }

  async getById(id: string) {
    return this.findTripOrThrow(AppDataSource.manager, id);
  }

  /**
   * Shared lookup used by both the plain getById() and create(). Takes an
   * explicit EntityManager so callers running inside a transaction can pass
   * its manager (tm) instead of the default one. This matters: a lookup via
   * the default manager runs on a different DB connection, which - under
   * normal read-committed isolation - cannot see rows written by a
   * transaction that hasn't committed yet. Using the wrong manager here
   * previously made create() think its own not-yet-committed trip didn't
   * exist, which rolled the whole transaction back.
   */
  private async findTripOrThrow(manager: EntityManager, id: string): Promise<ShoppingTrip> {
    const trip = await manager.findOne(ShoppingTrip, {
      where: { id },
      relations: ['stops', 'stops.wishes']
    });
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
            // A targeted column update instead of mutating-then-save()ing
            // the full (eagerly loaded) entity: update() only ever touches
            // exactly the columns given here, so it can neither read from
            // nor be overridden by any relation object that TypeORM happens
            // to have eager-loaded alongside it elsewhere in this
            // transaction. See completeStop() below for a concrete case
            // where that eager baggage previously overwrote this exact
            // assignment again a few lines later.
            await tm.update(Wish, wish.id, { status: 'onTrip', assignedTripStopId: stop.id });
            await this.notificationService.create(wish.id, wish.createdById, 'wishOnTrip');
          }
        }
      }

      // Must use tm here, not this.getById()/this.tripRepo - the trip and
      // its stops only exist inside this not-yet-committed transaction.
      return this.findTripOrThrow(tm, trip.id);
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
          // update(), not save(): see the comment in create(). This matters
          // doubly here - stop.wishes (loaded above) stays populated with
          // this very wish for the rest of the method, and saving the full
          // `stop` entity afterwards would let TypeORM "fix up" the relation
          // from that stale array, silently re-attaching the wish to the
          // stop it was just supposed to leave.
          await tm.update(Wish, wish.id, { status: 'open', assignedTripStopId: null });
          await this.notificationService.create(wish.id, wish.createdById, 'wishNotFound');
        } else {
          await tm.update(Wish, wish.id, { status: 'purchased' });
        }
      }

      // Plain column update for the same reason - stop.wishes is still
      // attached to this `stop` object, so save(stop) would re-trigger
      // exactly the fix-up described above.
      await tm.update(TripStop, stop.id, { status: 'done' });

      const trip = await tm.findOne(ShoppingTrip, {
        where: { id: tripId },
        relations: ['stops'],
      });
      // The stop's own status update above already happened in this same
      // transaction, so this read sees it as 'done' - no separate handling
      // needed for "the stop we just completed".
      if (trip && trip.stops.every((s) => s.status === 'done')) {
        await tm.update(ShoppingTrip, tripId, { status: 'done' });
      }

      return tm.findOneOrFail(TripStop, { where: { id: stop.id } });
    });
  }
}
