import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import { initDatabase } from './storage/db.js'
import authRouter from './routes/auth.js'
import itineraryRouter from './routes/itineraries.js'
import { usingAI, aiProvider } from './services/ai.js'
import photosRouter from './routes/photos.js'
import albumsRouter from './routes/albums.js'
import { metricsMiddleware } from './middleware/metricsMiddleware.js'
import { register } from './metrics.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))  // Allow large avatar images
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Metrics middleware - must be before other route handlers
app.use(metricsMiddleware)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await initDatabase()

// Metrics endpoint
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
