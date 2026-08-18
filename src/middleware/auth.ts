import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

const authService = new AuthService();

export const authenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  const token = authHeader.slice(7);
  try {
    const { sub } = authService.verifyToken(token);
    req.user = { id: sub };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
