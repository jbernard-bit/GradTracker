
// lib/rateLimit.js
const rateLimit = new Map();

export function rateLimiter(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get existing requests for this identifier
  const requests = rateLimit.get(identifier) || [];
  
  // Filter out requests outside the current window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (validRequests.length >= limit) {
    return false;
  }
  
  // Add current request timestamp
  validRequests.push(now);
  rateLimit.set(identifier, validRequests);
  
  return true;
}

export function getRemainingRequests(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const requests = rateLimit.get(identifier) || [];
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  return Math.max(0, limit - validRequests.length);
}
