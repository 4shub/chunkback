import express, { Express, RequestHandler } from 'express';
import { createRouter } from '../../api/routes/routes';
import { CacheAdapter } from '../../streaming/shared/tool-response-cache/cache-adapter.interface';
import { setCacheAdapter } from '../../streaming/shared/tool-response-cache/tool-response-cache';

export interface ServerOptions {
  /**
   * Array of middleware functions to apply to all routes (except /health)
   * These will be applied in order before the API routes
   */
  middleware?: RequestHandler[];

  /**
   * Cache adapter for tool response caching
   * Defaults to in-memory cache if not provided
   */
  cacheAdapter?: CacheAdapter;
}

export function createServer(options?: ServerOptions): Express {
  const app = express();

  // Set cache adapter if provided
  if (options?.cacheAdapter) {
    setCacheAdapter(options.cacheAdapter);
  }

  // Base middleware
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST' && req.path.includes('chat/completions')) {
      console.log('Messages:', JSON.stringify(req.body?.messages, null, 2));
    }
    next();
  });

  // Health check endpoint (no auth or middleware required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Apply custom middleware if provided
  if (options?.middleware) {
    options.middleware.forEach((mw) => app.use(mw));
  }

  // Routes
  app.use(createRouter());

  return app;
}
