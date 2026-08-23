import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { CategoryService } from '../services/CategoryService';

const router = Router();
const categoryService = new CategoryService();

router.get('/', authenticated, async (_req, res, next) => {
  try {
    const categories = await categoryService.list();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
