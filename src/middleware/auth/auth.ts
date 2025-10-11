import { Request, Response, NextFunction } from 'express';

const API_KEY = 'cheesers1';
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Bypass auth if environment variable is set (for testing)
  if (BYPASS_AUTH) {
    next();
    return;
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  // Support both "Bearer <key>" and just "<key>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (token !== API_KEY) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  next();
}
