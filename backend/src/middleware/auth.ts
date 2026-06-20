import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: JWT_SECRET missing' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const userId = decoded?.id || decoded?.user_id;
    const user = userId ? await User.findByPk(userId) : null;

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};
