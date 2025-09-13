import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { get, run } from '../storage/db.js'

const router = Router()

const registerSchema = z.object({
	username: z.string().min(3),
	email: z.string().email(),
	password: z.string().min(6)
})

router.post('/register', async (req, res) => {
	try {
		const { username, email, password } = registerSchema.parse(req.body)
		const existing = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username])
		if (existing) return res.status(400).json({ error: 'User already exists' })
		const passwordHash = await bcrypt.hash(password, 10)
		const result = await run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, passwordHash])
		const userId = result.lastID
		const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
		res.json({ token, user: { id: userId, username, email } })
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6)
})

router.post('/login', async (req, res) => {
	try {
		const { email, password } = loginSchema.parse(req.body)
		const user = await get('SELECT * FROM users WHERE email = ?', [email])
		if (!user) return res.status(401).json({ error: 'Invalid credentials' })
		const ok = await bcrypt.compare(password, user.password_hash)
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
		const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
		res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
	} catch (err) {
		res.status(400).json({ error: err.message })
	}
})

export default router
