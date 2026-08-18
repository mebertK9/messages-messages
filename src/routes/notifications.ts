import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';
import { updateNotificationSchema } from '../dto/schemas';

const router = Router();
const notificationService = new NotificationService();

router.get('/', authenticated, async (req, res, next) => {
  try {
    const { unread } = req.query;
    const notifications = await notificationService.list(req.user!.id, { unread: unread === 'true' });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.patch('/:notificationId', authenticated, async (req, res, next) => {
  try {
    const body = updateNotificationSchema.parse(req.body);
    const notification = await notificationService.markAsRead(req.params.notificationId, body.read);
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

export default router;
