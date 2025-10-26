import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import responseTime from 'response-time';

import { initDatabase } from './storage/db.js';
import authRouter from './routes/auth.js';
import itineraryRouter from './routes/itineraries.js';
import { usingAI, aiProvider } from './services/ai.js';
import photosRouter from './routes/photos.js';
import albumsRouter from './routes/albums.js';
import { metricsMiddleware, trackActiveUsers } from './middleware/metricsMiddleware.js';
import { register, metrics } from './metrics.js';

dotenv.config();

const app = express();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we should run in metrics-only mode
const isMetricsMode = process.argv.includes('--metrics');
const port = isMetricsMode ? process.env.METRICS_PORT || 9091 : process.env.PORT || 3000;

// Initialize database
let dbInitialized = false;
try {
  await initDatabase();
  dbInitialized = true;
  metrics.dbConnectionStatus.set({ db_name: 'main' }, 1);
} catch (error) {
  console.error('Failed to initialize database:', error);
  metrics.dbConnectionStatus.set({ db_name: 'main' }, 0);
  
  // Don't exit in metrics mode to allow metrics collection even if DB is down
  if (!isMetricsMode) {
    process.exit(1);
  }
}

// In metrics-only mode, only expose the metrics endpoint
if (isMetricsMode) {
  app.get(process.env.METRICS_PATH || '/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metricsData = await register.metrics();
      res.end(metricsData);
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).end('Error generating metrics');
    }
  });
  
  // Start the metrics server
  app.listen(port, '0.0.0.0', () => {
    console.log(`Metrics server running on port ${port}`);
  });
  
  // Don't continue with the rest of the server setup
  process.exit(0);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add response time header
app.use(responseTime())

// Metrics middleware - must be before other route handlers
app.use(metricsMiddleware);
app.use(trackActiveUsers);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: dbInitialized ? 'CONNECTED' : 'DISCONNECTED',
    usingAI,
    aiProvider
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    
    // Update any runtime metrics
    const memoryUsage = process.memoryUsage();
    metrics.memoryUsage.set(memoryUsage.heapUsed / 1024 / 1024);
    
    const metricsData = await register.metrics();
    res.end(metricsData);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, usingAI, aiProvider })
})

app.use('/api/auth', authRouter)
app.use('/api/itineraries', itineraryRouter)
app.use('/api/photos', photosRouter)
app.use('/api/albums', albumsRouter)

// serve uploaded files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

// serve frontend build if exists
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))
app.get(/.*/, (req, res) => {
	res.sendFile(path.join(frontendDist, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`)
})
