import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { get, run } from '../storage/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router()

const registerSchema = z.object({
	username: z.string().min(3),
	email: z.string().email(),
	password: z.string().min(6)
})

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);
    
    // Check if user exists
    const existing = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }
    
    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    
    // Generate token
    const token = jwt.sign(
      { userId: result.lastID },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: result.lastID, 
        username, 
        email 
      } 
    });
    
  } catch (err) {
    console.error('[register] Error:', err);
    res.status(400).json({ error: err.message });
  }
});

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6)
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      // Simulate password hashing to prevent timing attacks
      await bcrypt.hash('dummy', 10);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
    
  } catch (err) {
    console.error('[login] Error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router

// Profile endpoints
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, username, email FROM users WHERE id = ?', 
      [req.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('[me] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body || {}
    if (!username && !email) return res.status(400).json({ error: 'No fields' })
    if (email) {
      const exists = await get('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.userId])
      if (exists) return res.status(400).json({ error: 'Email already in use' })
    }
    if (username) {
      const exists = await get('SELECT id FROM users WHERE username = ? AND id <> ?', [username, req.userId])
      if (exists) return res.status(400).json({ error: 'Username already in use' })
    }
    await run('UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?', [username || null, email || null, req.userId])
    const user = await get('SELECT id, username, email FROM users WHERE id = ?', [req.userId])
    res.json(user)
  } catch (err) {
    console.error('[me] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
  if (username) {
    const exists = await get('SELECT id FROM users WHERE username = ? AND id <> ?', [username, req.userId])
    if (exists) return res.status(400).json({ error: 'Username already in use' })
  }
  await run('UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?', [username || null, email || null, req.userId])
  const user = await get('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [req.userId])
  res.json(user)
})

router.put('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })
  const user = await get('SELECT * FROM users WHERE id = ?', [req.userId])
  if (!user) return res.status(404).json({ error: 'Not found' })
  const ok = await bcrypt.compare(currentPassword, user.password_hash)
  if (!ok) return res.status(400).json({ error: 'Current password incorrect' })
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.userId])
  res.json({ ok: true })
})

// Simple avatar upload via base64 data URL (keep simple for now)
router.put('/me/avatar', requireAuth, async (req, res) => {
  const { avatar } = req.body || {}
  if (typeof avatar !== 'string' || avatar.length < 10) return res.status(400).json({ error: 'Invalid avatar' })
  await run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.userId])
  const user = await get('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [req.userId])
  res.json(user)
})
