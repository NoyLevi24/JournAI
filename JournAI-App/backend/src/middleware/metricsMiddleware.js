import { httpRequestDurationMicroseconds, apiCallsCounter } from '../metrics.js';

/**
 * Middleware to collect metrics for all HTTP requests
 */
export const metricsMiddleware = (req, res, next) => {
  // Skip metrics endpoint to avoid recursive calls
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();
  const originalEnd = res.end;

  // Track response finish
  res.end = function (chunk, encoding) {
    try {
      const [seconds, nanoseconds] = process.hrtime(start);
      const responseTimeInMs = (seconds * 1000) + (nanoseconds / 1e6);
      const responseTimeInSeconds = responseTimeInMs / 1000;
      
      // Get the route path, fallback to URL path if route is not available
      const routePath = req.route?.path || req.baseUrl || req.path;
      
      // Only record metrics if we have a valid route path
      if (routePath) {
        // Update response time histogram
        httpRequestDurationMicroseconds
          .labels({
            method: req.method,
            route: routePath,
            code: res.statusCode
          })
          .observe(responseTimeInSeconds);

        // Update API call counter
        apiCallsCounter.inc({
          endpoint: routePath,
          method: req.method,
          status: res.statusCode
        });
      }
    } catch (error) {
      console.error('Error in metrics middleware:', error);
      // Don't fail the request if metrics collection fails
    } finally {
      // Always call the original end function
      return originalEnd.call(this, chunk, encoding);
    }
  };

  next();
};
