import { Router } from 'express'
import { z } from 'zod'
import { all, get, run } from '../storage/db.js'
import { requireAuth } from '../middleware/auth.js'
import { generateItinerary } from '../services/ai.js'

const router = Router()

const createSchema = z.object({
	destination: z.string().min(2),
	budget: z.string().min(1),
	durationDays: z.number().int().min(1).max(30),
	interests: z.array(z.string()).nonempty()
})

router.post('/', requireAuth, async (req, res) => {
	try {
		const input = createSchema.parse(req.body)
		const plan = await generateItinerary(input)
		console.log('[itineraries:create]', {
			destination: input.destination,
			duration: input.durationDays,
			interests: input.interests,
			days: Array.isArray(plan?.days) ? plan.days.length : 0
		})
		const result = await run(
			`INSERT INTO itineraries (user_id, destination, budget, duration_days, interests, plan_json) VALUES (?, ?, ?, ?, ?, ?)`,
			[
				req.userId,
				input.destination,
				input.budget,
				input.durationDays,
				JSON.stringify(input.interests),
				JSON.stringify(plan)
			]
		)
		const id = result.lastID
		res.json({ id, ...input, plan })
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

router.get('/', requireAuth, async (req, res) => {
	const rows = await all('SELECT * FROM itineraries WHERE user_id = ? ORDER BY created_at DESC', [req.userId])
	res.json(rows.map(formatRow))
})

router.get('/:id', requireAuth, async (req, res) => {
	const row = await get('SELECT * FROM itineraries WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
	if (!row) return res.status(404).json({ error: 'Not found' })
	res.json(formatRow(row))
})

router.put('/:id', requireAuth, async (req, res) => {
	const { plan } = req.body
	await run('UPDATE itineraries SET plan_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [JSON.stringify(plan), req.params.id, req.userId])
	const row = await get('SELECT * FROM itineraries WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
	if (!row) return res.status(404).json({ error: 'Not found' })
	res.json(formatRow(row))
})

router.delete('/:id', requireAuth, async (req, res) => {
	await run('DELETE FROM itineraries WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
	res.json({ ok: true })
})

router.post('/:id/share', requireAuth, async (req, res) => {
	const shareCode = Math.random().toString(36).slice(2, 10)
	await run('UPDATE itineraries SET is_public = 1, share_code = ? WHERE id = ? AND user_id = ?', [shareCode, req.params.id, req.userId])
	res.json({ shareCode })
})

router.get('/shared/:code', async (req, res) => {
	const row = await get('SELECT * FROM itineraries WHERE share_code = ? AND is_public = 1', [req.params.code])
	if (!row) return res.status(404).json({ error: 'Not found' })
	res.json(formatRow(row))
})

function formatRow(row) {
	return {
		id: row.id,
		destination: row.destination,
		budget: row.budget,
		durationDays: row.duration_days,
		interests: JSON.parse(row.interests || '[]'),
		plan: JSON.parse(row.plan_json || '{}'),
		isPublic: !!row.is_public,
		shareCode: row.share_code || null,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}
}

export default router
