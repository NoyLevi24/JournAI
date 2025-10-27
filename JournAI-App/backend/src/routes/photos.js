import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { all, run, get } from '../storage/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Always use /app/uploads for uploads
const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory at: ${uploadDir}`);
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

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

// Update photo metadata
router.put('/:photoId', requireAuth, async (req, res) => {
    const { title, caption, takenAt, location, tags, albumId } = req.body || {}
    const row = await get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [req.params.photoId, req.userId])
    if (!row) return res.status(404).json({ error: 'Not found' })
    await run('UPDATE photos SET title = COALESCE(?, title), caption = COALESCE(?, caption), taken_at = COALESCE(?, taken_at), location = COALESCE(?, location), tags = COALESCE(?, tags), album_id = COALESCE(?, album_id) WHERE id = ?', [title || null, caption || null, takenAt || null, location || null, tags ? JSON.stringify(tags) : null, albumId || null, req.params.photoId])
    const updated = await get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [req.params.photoId, req.userId])
    res.json(updated)
})

router.post('/:itineraryId', requireAuth, upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const caption = req.body.caption || null
    const title = req.body.title || null
    const takenAt = req.body.takenAt || null
    const location = req.body.location || null
    const tags = req.body.tags ? JSON.stringify(req.body.tags) : null
    const albumId = req.body.albumId || null
    const result = await run('INSERT INTO photos (itinerary_id, user_id, filename, caption, title, taken_at, location, tags, album_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.params.itineraryId, req.userId, req.file.filename, caption, title, takenAt, location, tags, albumId])
    res.json({ id: result.lastID, filename: req.file.filename, caption, title, takenAt, location, tags: req.body.tags || null, albumId })
})

router.delete('/:photoId', requireAuth, async (req, res) => {
	const row = await get('SELECT * FROM photos WHERE id = ? AND user_id = ?', [req.params.photoId, req.userId])
	if (!row) return res.status(404).json({ error: 'Not found' })
	try { fs.unlinkSync(path.join(uploadDir, row.filename)) } catch {}
	await run('DELETE FROM photos WHERE id = ? AND user_id = ?', [req.params.photoId, req.userId])
	res.json({ ok: true })
})

export default router
