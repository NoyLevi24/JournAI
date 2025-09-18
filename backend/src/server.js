import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import { initDatabase } from './storage/db.js'
import authRouter from './routes/auth.js'
import itineraryRouter from './routes/itineraries.js'
import { usingOpenAI } from './services/ai.js'
import photosRouter from './routes/photos.js'
import albumsRouter from './routes/albums.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await initDatabase()

app.get('/api/health', (req, res) => {
	res.json({ ok: true, usingOpenAI })
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
