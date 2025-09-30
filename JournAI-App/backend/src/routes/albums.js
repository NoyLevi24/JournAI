import { Router } from 'express'
import { all, get, run } from '../storage/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// List albums for a trip
router.get('/itinerary/:itineraryId', requireAuth, async (req, res) => {
  const rows = await all('SELECT * FROM albums WHERE user_id = ? AND itinerary_id = ? ORDER BY created_at DESC', [req.userId, req.params.itineraryId])
  res.json(rows)
})

// Create album
router.post('/itinerary/:itineraryId', requireAuth, async (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name required' })
  const result = await run('INSERT INTO albums (user_id, itinerary_id, name) VALUES (?, ?, ?)', [req.userId, req.params.itineraryId, name])
  res.json({ id: result.lastID, name })
})

// Rename / delete album
router.put('/:id', requireAuth, async (req, res) => {
  const { name } = req.body || {}
  await run('UPDATE albums SET name = COALESCE(?, name) WHERE id = ? AND user_id = ?', [name || null, req.params.id, req.userId])
  const row = await get('SELECT * FROM albums WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

router.delete('/:id', requireAuth, async (req, res) => {
  await run('DELETE FROM albums WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  // Orphan photos remain in general album (null album_id)
  res.json({ ok: true })
})

export default router


