import express, { Express, RequestHandler } from 'express';
import { createRouter } from '../../api/routes/routes';

export interface ServerOptions {
  /**
   * Array of middleware functions to apply to all routes (except /health)
   * These will be applied in order before the API routes
   */
  middleware?: RequestHandler[];
}

export function createServer(options?: ServerOptions): Express {
  const app = express();

  // Base middleware
  app.use(express.json());

  // Health check endpoint (no auth or middleware required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Apply custom middleware if provided
  if (options?.middleware) {
    options.middleware.forEach(mw => app.use(mw));
  }

  // Routes
  app.use(createRouter());

  return app;
}
