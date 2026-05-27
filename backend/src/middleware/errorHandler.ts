import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
  data?: any;
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && status >= 500
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';
  const data = err.data || null;

  res.status(status).json({
    success: false,
    message,
    ...(!isProduction && data && { data }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};
