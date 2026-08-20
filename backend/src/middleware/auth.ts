import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../models/users';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

    const token = auth.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.sub as number;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Optionally load user for richer req.user
    const user = await findUserById(userId);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    req.user = { id: user.id };
    next();
  } catch (err) {
    console.error('auth middleware error', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
