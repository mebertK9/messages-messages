import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { WishService } from '../services/WishService';
import { createWishSchema } from '../dto/schemas';

const router = Router();
const wishService = new WishService();

router.get('/', authenticated, async (req, res, next) => {
  try {
    const { status, createdById, shopId } = req.query;
    const wishes = await wishService.list({
      status: status as string,
      createdById: createdById as string,
      shopId: shopId as string,
    });
    res.json(wishes);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticated, async (req, res, next) => {
  try {
    const body = createWishSchema.parse(req.body);
    const wish = await wishService.create(body.productId, req.user!.id);
    res.status(201).json(wish);
  } catch (err) {
    next(err);
  }
});

router.delete('/:wishId', authenticated, async (req, res, next) => {
  try {
    await wishService.retract(req.params.wishId, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
