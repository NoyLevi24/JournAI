import { httpRequestDurationMicroseconds, apiCallsCounter } from '../metrics.js';

export const metricsMiddleware = (req, res, next) => {
  // דילוג על endpoint של metrics כדי לא למדוד את עצמנו
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime();
  const originalEnd = res.end;

  // מעקב אחר סיום התשובה
  res.end = function (chunk, encoding) {
    // חישוב זמן התגובה במילישניות
    const [seconds, nanoseconds] = process.hrtime(start);
    const responseTimeInMs = (seconds * 1000) + (nanoseconds / 1e6);
    const responseTimeInSeconds = responseTimeInMs / 1000;
    
    // עדכון מדד זמן התגובה
    httpRequestDurationMicroseconds
      .labels({
        method: req.method,
        route: req.route?.path || req.path,
        code: res.statusCode
      })
      .observe(responseTimeInSeconds);

    // עדכון מונה הבקשות
    apiCallsCounter.inc({
      endpoint: req.route?.path || req.path,
      method: req.method,
      status: res.statusCode
    });
    
    // קריאה לפונקציית הסיום המקורית
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
