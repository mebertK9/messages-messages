import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { ShopService } from '../services/ShopService';

const router = Router();
const shopService = new ShopService();

router.get('/', authenticated, async (req, res, next) => {
  try {
    const shops = await shopService.list();
    res.json(shops);
  } catch (err) {
    next(err);
  }
});

export default router;
