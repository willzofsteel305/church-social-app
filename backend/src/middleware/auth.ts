import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (!token || !['Bearer', 'Token'].includes(scheme)) {
    return res.status(401).json({ message: 'Authentication token required' });
  }
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ message: 'JWT secret not configured' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as Express.UserPayload;
    req.user = decoded;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
