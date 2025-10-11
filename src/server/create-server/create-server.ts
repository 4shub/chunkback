import express, { Express } from 'express';
import { createRouter } from '../../api/routes/routes';
import { authMiddleware } from '../../middleware/auth/auth';

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(express.json());

  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Apply auth middleware to all API routes
  app.use(authMiddleware);

  // Routes
  app.use(createRouter());

  return app;
}
