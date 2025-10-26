import { metrics } from '../metrics.js';

const { httpRequestDurationMicroseconds, apiCallsCounter, activeUsers } = metrics;

// List of paths to exclude from metrics collection
const EXCLUDED_PATHS = ['/metrics', '/health', '/favicon.ico'];

// Helper function to get response time in milliseconds
const getResponseTimeInMs = (start) => {
  const [seconds, nanoseconds] = process.hrtime(start);
  return (seconds * 1000) + (nanoseconds / 1e6);
};

/**
 * Get a normalized route path from the request
 */
const getRoutePath = (req) => {
  // Skip excluded paths
  if (EXCLUDED_PATHS.includes(req.path)) {
    return req.path;
  }
  
  // Try to get the route path from express router
  if (req.route && req.route.path) {
    return req.route.path;
  }
  
  // For static files or API routes
  if (req.baseUrl) {
    return req.baseUrl;
  }
  
  // Fallback to the request path
  return req.path || 'unknown';
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
      const responseTimeInMs = getResponseTimeInMs(start);
      const routePath = getRoutePath(req);
      const statusCode = res.statusCode || 200;
      
      // Skip metrics for excluded paths
      if (!EXCLUDED_PATHS.includes(routePath)) {
        // Update response time histogram
        httpRequestDurationMicroseconds
          .labels({
            method: req.method,
            route: routePath,
            code: statusCode
          })
          .observe(responseTimeInMs / 1000); // Convert to seconds

        // Update API call counter
        apiCallsCounter.inc({
          endpoint: routePath,
          method: req.method,
          status: statusCode
        });
      }
      
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
  // Skip excluded paths
  if (EXCLUDED_PATHS.includes(req.path)) {
    return next();
  }
  
  // Check if user is authenticated (modify this based on your auth system)
  const userId = req.user?.id || req.ip;
  
  if (userId) {
    // Increment active users
    activeUsers.inc({ user: userId.toString().substring(0, 50) });
    
    // Decrement when response finishes
    res.on('finish', () => {
      activeUsers.dec({ user: userId.toString().substring(0, 50) });
    });
  }
  
  next();
};
