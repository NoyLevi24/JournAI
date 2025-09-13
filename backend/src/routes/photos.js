import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { all, run, get } from '../storage/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const uploadDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname)
		const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_')
		cb(null, `${Date.now()}_${base}${ext}`)
	}
})
const upload = multer({ storage })

router.get('/:itineraryId', requireAuth, async (req, res) => {
	const rows = await all('SELECT * FROM photos WHERE itinerary_id = ? AND user_id = ? ORDER BY created_at DESC', [req.params.itineraryId, req.userId])
	res.json(rows)
})

router.post('/:itineraryId', requireAuth, upload.single('photo'), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'No file' })
	const caption = req.body.caption || null
	const result = await run('INSERT INTO photos (itinerary_id, user_id, filename, caption) VALUES (?, ?, ?, ?)', [req.params.itineraryId, req.userId, req.file.filename, caption])
	res.json({ id: result.lastID, filename: req.file.filename, caption })
})

router.delete('/:photoId', requireAuth, async (req, res) => {
	const row = await get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [req.params.photoId, req.userId])
	if (!row) return res.status(404).json({ error: 'Not found' })
	try { fs.unlinkSync(path.join(uploadDir, row.filename)) } catch {}
	await run('DELETE FROM photos WHERE id = ? AND user_id = ?', [req.params.photoId, req.userId])
	res.json({ ok: true })
})

export default router
