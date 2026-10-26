import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/db.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';

export function ensureDbConnected(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return next(
      new AppError(
        503,
        'DATABASE_UNAVAILABLE',
        'Database connection is currently unavailable. Please verify MongoDB service is running.'
      )
    );
  }
  next();
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired authentication token');
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new AppError(403, 'ACCOUNT_INACTIVE', 'User account is inactive or no longer exists');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          'FORBIDDEN',
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
    }
    next();
  };
}
