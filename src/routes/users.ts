import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { UserService } from '../services/UserService';
import { updateMeSchema } from '../dto/schemas';

const router = Router();
const userService = new UserService();

router.get('/me', authenticated, async (req, res, next) => {
  try {
    const user = await userService.getMeData(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', authenticated, async (req, res, next) => {
  try {
    const body = updateMeSchema.parse(req.body);
    const user = await userService.updateMe(req.user!.id, body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;