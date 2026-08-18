import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { NotFoundError } from '../utils/errors';

type NotificationType = 'wishOnTrip' | 'wishAddedToActiveTrip' | 'wishRetracted' | 'wishNotFound';

export class NotificationService {
  private notificationRepo = AppDataSource.getRepository(Notification);

  async list(recipientId: string, options?: { unread?: boolean }) {
    let query = this.notificationRepo.createQueryBuilder('notification').where('notification.recipientId = :recipientId', {
      recipientId,
    });

    if (options?.unread) {
      query = query.andWhere('notification.read = false');
    }

    return query.orderBy('notification.createdAt', 'DESC').getMany();
  }

  async getById(id: string) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundError('Notification not found');
    return notification;
  }

  async create(wishId: string, recipientId: string, type?: NotificationType) {
    if (!type) return;
    const notification = this.notificationRepo.create({
      wishId,
      recipientId,
      type,
      read: false,
    });
    return this.notificationRepo.save(notification);
  }

  async markAsRead(id: string, read: boolean) {
    const notification = await this.getById(id);
    notification.read = read;
    return this.notificationRepo.save(notification);
  }
}
