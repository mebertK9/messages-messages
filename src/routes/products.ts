import { Router } from 'express';
import { authenticated } from '../middleware/auth';
import { ProductService } from '../services/ProductService';
import { createProductSchema, updateProductSchema } from '../dto/schemas';

const router = Router();
const productService = new ProductService();

router.get('/', authenticated, async (req, res, next) => {
  try {
    const { unassigned, categoryId } = req.query;
    const products = await productService.list({
      unassigned: unassigned === 'true',
      categoryId: categoryId as string | undefined,
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticated, async (req, res, next) => {
  try {
    const body = createProductSchema.parse(req.body);
    const product = await productService.create(body.name, body.categoryId);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.patch('/:productId', authenticated, async (req, res, next) => {
  try {
    const body = updateProductSchema.parse(req.body);
    const product = await productService.updatePreferredShop(req.params.productId, body.preferredShopId);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
