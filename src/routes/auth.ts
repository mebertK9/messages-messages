import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema } from '../dto/schemas';

const router = Router();
const authService = new AuthService();

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.name, body.password, body.email);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.name, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
