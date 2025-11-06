import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDatabase } from './storage/db.js';
import authRouter from './routes/auth.js';
import itineraryRouter from './routes/itineraries.js';
import { usingAI, aiProvider } from './services/ai.js';
import photosRouter from './routes/photos.js';
import albumsRouter from './routes/albums.js';
import { metricsMiddleware, trackActiveUsers } from './middleware/metricsMiddleware.js';
import { register } from './metrics.js';

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
} catch (error) {
  console.error('Failed to initialize database:', error);
  
  // Don't exit in metrics mode to allow metrics collection even if DB is down
  if (!isMetricsMode) {
    process.exit(1);
  }
}

// In metrics-only mode, only expose the metrics endpoint
if (isMetricsMode) {
  console.log('Starting in metrics-only mode...');
  
  app.get(process.env.METRICS_PATH || '/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).end('Error generating metrics');
    }
  });
  
  // Health check for metrics server
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      mode: 'metrics-only',
      timestamp: new Date().toISOString()
    });
  });
  
  // Start the metrics server
  app.listen(port, '0.0.0.0', () => {
    console.log(`Metrics server running on port ${port}`);
    console.log(`Metrics available at http://0.0.0.0:${port}/metrics`);
  });
  
  
} else {
  // Regular application mode
  console.log('Starting in application mode...');
  
  // Base middleware
  const responseTime = (await import('response-time')).default;
  app.use(responseTime());
  
  // Enable CORS for all routes
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
  
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Metrics middleware
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

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      ok: true, 
      usingAI, 
      aiProvider,
      database: dbInitialized ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString()
    });
  });

  // Metrics endpoint (also available on main app)
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.status(500).end('Error generating metrics');
    }
  });

  // File uploads are now handled by S3, no local file storage needed
  console.log('Using S3 for file storage');

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/itineraries', itineraryRouter);
  app.use('/api/photos', photosRouter);
  app.use('/api/albums', albumsRouter);

  // Serve static files from the frontend dist folder
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  const PORT = process.env.PORT || 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`)
  })
}