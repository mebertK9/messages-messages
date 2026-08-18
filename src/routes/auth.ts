import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema } from '../dto/schemas';

const router = Router();
const authService = new AuthService();

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.name, body.password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
