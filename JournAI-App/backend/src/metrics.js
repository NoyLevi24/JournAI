import client from 'prom-client';

// Create a Registry which registers the metrics
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'jornai-app',
  pod: process.env.POD_NAME || 'local',
  namespace: process.env.NAMESPACE || 'local'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'node_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10
});

// HTTP request duration histogram
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// API calls counter
export const apiCallsCounter = new client.Counter({
  name: 'api_calls_total',
  help: 'Total number of API calls',
  labelNames: ['endpoint', 'method', 'status'],
  registers: [register]
});

// Active users gauge
export const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['type'],
  registers: [register]
});

// Database connection status
export const dbConnectionStatus = new client.Gauge({
  name: 'db_connection_status',
  help: 'Database connection status (1 = connected, 0 = disconnected)',
  labelNames: ['db_name'],
  registers: [register]
});

// Export all metrics for easier imports
export const metrics = {
  httpRequestDurationMicroseconds,
  apiCallsCounter,
  activeUsers,
  dbConnectionStatus
};

export default {
  register,
  ...metrics
};
