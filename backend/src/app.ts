import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import corsMiddleware from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter, sameOriginWriteGuard, securityHeaders } from './middleware/security';
import routes from './routes';
import { loadBackendEnv } from './config/env';

loadBackendEnv();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(securityHeaders);
app.use(sameOriginWriteGuard);
app.use(apiRateLimiter);
app.use(corsMiddleware);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'API is running' });
});

// API root
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Ngọc Thiện Wedding API running on port ' + (process.env.PORT || 4000),
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
