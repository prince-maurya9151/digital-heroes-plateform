import { AppError } from '../utils/AppError.js';

export const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : next(new AppError('Admin only', 403));

