
// lib/withRateLimit.js
import { rateLimiter, getRemainingRequests } from './rateLimit';

export function withRateLimit(handler, options = {}) {
  const { 
    limit = 100, 
    windowMs = 60000, 
    keyGenerator = (req) => req.connection.remoteAddress 
  } = options;

  return async (req, res) => {
    const identifier = keyGenerator(req);
    
    if (!rateLimiter(identifier, limit, windowMs)) {
      const remaining = getRemainingRequests(identifier, limit, windowMs);
      
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000),
        remaining: remaining
      });
      return;
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', getRemainingRequests(identifier, limit, windowMs));
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs));
    
    return handler(req, res);
  };
}
