import express from 'express';
import { register } from './src/metrics.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.METRICS_PORT || 9091;

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Metrics server listening on port ${PORT}, metrics exposed on /metrics endpoint`);
});
