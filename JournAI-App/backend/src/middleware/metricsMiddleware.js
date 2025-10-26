import { metrics } from '../metrics.js';

const { httpRequestDurationMicroseconds, apiCallsCounter } = metrics;

// List of paths to exclude from metrics collection
const EXCLUDED_PATHS = ['/metrics', '/health', '/favicon.ico'];

/**
 * Get a normalized route path from the request
 */
const getRoutePath = (req) => {
  // Try to get the route path from express router
  if (req.route && req.route.path) {
    return req.route.path;
  }
  
  // For static files, use the base URL
  if (req.baseUrl) {
    return req.baseUrl;
  }
  
  // Fallback to the request path
  return req.path;
};

/**
 * Middleware to collect metrics for all HTTP requests
 */
export const metricsMiddleware = (req, res, next) => {
  // Skip excluded paths
  if (EXCLUDED_PATHS.includes(req.path)) {
    return next();
  }

  const start = process.hrtime();
  const originalEnd = res.end;

  // Track response finish
  res.end = function (chunk, encoding) {
    const responseEnd = originalEnd.bind(this);
    
    try {
      const [seconds, nanoseconds] = process.hrtime(start);
      const responseTimeInMs = (seconds * 1000) + (nanoseconds / 1e6);
      const responseTimeInSeconds = responseTimeInMs / 1000;
      
      // Get the normalized route path
      const routePath = getRoutePath(req);
      const statusCode = res.statusCode || 200;
      
      // Update response time histogram
      httpRequestDurationMicroseconds
        .labels({
          method: req.method,
          route: routePath,
          code: statusCode
        })
        .observe(responseTimeInSeconds);

      // Update API call counter
      apiCallsCounter.inc({
        endpoint: routePath,
        method: req.method,
        status: statusCode
      });
      
    } catch (error) {
      console.error('Error in metrics middleware:', error);
      // Don't fail the request if metrics collection fails
    } finally {
      // Always call the original end function
      return responseEnd(chunk, encoding);
    }
  };

  next();
};

/**
 * Middleware to track active users
 */
export const trackActiveUsers = (req, res, next) => {
  if (req.user) {
    metrics.activeUsers.inc({ type: 'active' });
    
    // Decrement when response finishes
    res.on('finish', () => {
      metrics.activeUsers.dec({ type: 'active' });
    });
  }
  
  next();
};
