import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.resolve(__dirname, '../../data/journai.sqlite')

let db

export function getDb() {
	if (!db) throw new Error('Database not initialized')
	return db
}

export async function initDatabase() {
	await new Promise((resolve) => {
		const sqlite = sqlite3.verbose()
		db = new sqlite.Database(dbPath, resolve)
	})

	await run(`PRAGMA foreign_keys = ON`)

	await run(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)

	// Add optional columns if missing
	await ensureUserOptionalColumns()
	await ensurePhotoOptionalColumns()

	// Albums table
	await run(`
		CREATE TABLE IF NOT EXISTS albums (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			itinerary_id INTEGER NOT NULL,
			name TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY(itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
		)
	`)

	await run(`
		CREATE TABLE IF NOT EXISTS itineraries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			destination TEXT NOT NULL,
			budget TEXT NOT NULL,
			duration_days INTEGER NOT NULL,
			interests TEXT NOT NULL,
			plan_json TEXT NOT NULL,
			is_public INTEGER NOT NULL DEFAULT 0,
			share_code TEXT UNIQUE,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)

	await run(`
		CREATE TABLE IF NOT EXISTS photos (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			itinerary_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			filename TEXT NOT NULL,
			caption TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`)
}

export function run(sql, params = []) {
	return new Promise((resolve, reject) => {
		getDb().run(sql, params, function (err) {
			if (err) return reject(err)
			resolve(this)
		})
	})
}

export function get(sql, params = []) {
	return new Promise((resolve, reject) => {
		getDb().get(sql, params, function (err, row) {
			if (err) return reject(err)
			resolve(row)
		})
	})
}

export function all(sql, params = []) {
	return new Promise((resolve, reject) => {
		getDb().all(sql, params, function (err, rows) {
			if (err) return reject(err)
			resolve(rows)
		})
	})
}

async function ensureUserOptionalColumns() {
	// Ensure 'avatar' column exists
	const cols = await all(`PRAGMA table_info(users)`)
	const hasAvatar = cols?.some(c => c.name === 'avatar')
	if (!hasAvatar) {
		try { await run(`ALTER TABLE users ADD COLUMN avatar TEXT`) } catch {}
	}
}

// Ensure photos table has album and metadata columns
async function ensurePhotoOptionalColumns() {
	const cols = await all(`PRAGMA table_info(photos)`)
	const hasAlbum = cols?.some(c => c.name === 'album_id')
	if (!hasAlbum) { try { await run(`ALTER TABLE photos ADD COLUMN album_id INTEGER`) } catch {} }
	const hasTitle = cols?.some(c => c.name === 'title')
	if (!hasTitle) { try { await run(`ALTER TABLE photos ADD COLUMN title TEXT`) } catch {} }
	const hasTakenAt = cols?.some(c => c.name === 'taken_at')
	if (!hasTakenAt) { try { await run(`ALTER TABLE photos ADD COLUMN taken_at TEXT`) } catch {} }
	const hasLocation = cols?.some(c => c.name === 'location')
	if (!hasLocation) { try { await run(`ALTER TABLE photos ADD COLUMN location TEXT`) } catch {} }
	const hasTags = cols?.some(c => c.name === 'tags')
	if (!hasTags) { try { await run(`ALTER TABLE photos ADD COLUMN tags TEXT`) } catch {} }
}
