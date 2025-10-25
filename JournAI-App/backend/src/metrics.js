import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'jornai-app'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a custom metric - HTTP request duration histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
});

// Register the custom metric
register.registerMetric(httpRequestDurationMicroseconds);

// Create a counter for tracking API requests
const apiCallsCounter = new client.Counter({
  name: 'api_calls_total',
  help: 'Total number of API calls',
  labelNames: ['endpoint', 'method', 'status']
});

// Register the counter
register.registerMetric(apiCallsCounter);

// Create a gauge for tracking active users
const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['type']
});

// Register the gauge
register.registerMetric(activeUsers);

export {
  register,
  httpRequestDurationMicroseconds,
  apiCallsCounter,
  activeUsers
};
