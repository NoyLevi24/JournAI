import sqlite3 from 'sqlite3'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.resolve(__dirname, '../../data/journai.sqlite')

const DB_CLIENT = process.env.DB_CLIENT || 'sqlite3'
let db
let pool

export function getDb() {
	if (DB_CLIENT === 'postgres') {
		if (!pool) throw new Error('Database not initialized')
		return pool
	}
	if (!db) throw new Error('Database not initialized')
	return db
}

export function isPostgres() {
	return DB_CLIENT === 'postgres'
}

function getSerial() {
	return isPostgres() ? 'SERIAL' : 'INTEGER'
}

function getAutoIncrement() {
	return isPostgres() ? '' : 'AUTOINCREMENT'
}

function getTimestamp() {
	return isPostgres() ? 'TIMESTAMP' : 'TEXT'
}

function getCurrentTimestamp() {
	return isPostgres() ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP'
}

export async function initDatabase() {
	if (DB_CLIENT === 'postgres') {
		// PostgreSQL connection
		pool = new Pool({
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '5432'),
			database: process.env.DB_NAME || 'journai',
			user: process.env.DB_USER || 'journai',
			password: process.env.DB_PASSWORD || 'journai',
		})
		
		console.log('✅ Connected to PostgreSQL')
		
		// Create tables with PostgreSQL syntax
		await run(`
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				username TEXT NOT NULL UNIQUE,
				email TEXT NOT NULL UNIQUE,
				password_hash TEXT NOT NULL,
				avatar TEXT,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`)

		await run(`
			CREATE TABLE IF NOT EXISTS itineraries (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL,
				destination TEXT NOT NULL,
				budget TEXT NOT NULL,
				duration_days INTEGER NOT NULL,
				interests TEXT NOT NULL,
				plan_json TEXT NOT NULL,
				is_public INTEGER NOT NULL DEFAULT 0,
				share_code TEXT UNIQUE,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`)

		await run(`
			CREATE TABLE IF NOT EXISTS albums (
				id SERIAL PRIMARY KEY,
				user_id INTEGER NOT NULL,
				itinerary_id INTEGER NOT NULL,
				name TEXT NOT NULL,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
			)
		`)

		await run(`
			CREATE TABLE IF NOT EXISTS photos (
				id SERIAL PRIMARY KEY,
				itinerary_id INTEGER NOT NULL,
				user_id INTEGER NOT NULL,
				filename TEXT NOT NULL,
				caption TEXT,
				title TEXT,
				taken_at TEXT,
				location TEXT,
				tags TEXT,
				album_id INTEGER,
				created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE SET NULL
			)
		`)
		
		console.log('✅ PostgreSQL tables created/verified')
	} else {
		// SQLite connection
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

		// Add optional columns if missing (SQLite only)
		await ensureUserOptionalColumns()
		await ensurePhotoOptionalColumns()

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
		
		console.log('✅ SQLite database initialized')
	}
}

// Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
function convertPlaceholders(sql) {
	if (DB_CLIENT !== 'postgres') return sql
	let index = 1
	return sql.replace(/\?/g, () => `$${index++}`)
}

export function run(sql, params = []) {
	if (DB_CLIENT === 'postgres') {
		let pgSql = convertPlaceholders(sql)
		// Add RETURNING id for INSERT statements
		if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
			pgSql = pgSql.trim().replace(/;?\s*$/, '') + ' RETURNING id'
		}
		return pool.query(pgSql, params).then(res => ({ 
			lastID: res.rows[0]?.id, 
			changes: res.rowCount 
		})).catch(err => {
			console.error('PostgreSQL run() error:', err.message)
			console.error('Original SQL:', sql)
			console.error('Converted SQL:', pgSql)
			console.error('Params:', params)
			throw err
		})
	}
	return new Promise((resolve, reject) => {
		getDb().run(sql, params, function (err) {
			if (err) return reject(err)
			resolve(this)
		})
	})
}

export function get(sql, params = []) {
	if (DB_CLIENT === 'postgres') {
		const pgSql = convertPlaceholders(sql)
		return pool.query(pgSql, params).then(res => res.rows[0]).catch(err => {
			console.error('PostgreSQL query error:', err.message)
			console.error('SQL:', pgSql)
			console.error('Params:', params)
			throw err
		})
	}
	return new Promise((resolve, reject) => {
		getDb().get(sql, params, function (err, row) {
			if (err) return reject(err)
			resolve(row)
		})
	})
}

export function all(sql, params = []) {
	if (DB_CLIENT === 'postgres') {
		const pgSql = convertPlaceholders(sql)
		return pool.query(pgSql, params).then(res => res.rows).catch(err => {
			console.error('PostgreSQL all() error:', err.message)
			console.error('Original SQL:', sql)
			console.error('Converted SQL:', pgSql)
			console.error('Params:', params)
			throw err
		})
	}
	return new Promise((resolve, reject) => {
		getDb().all(sql, params, function (err, rows) {
			if (err) return reject(err)
			resolve(rows)
		})
	})
}

async function ensureUserOptionalColumns() {
	if (isPostgres()) return // PostgreSQL already has all columns
	
	// Ensure 'avatar' column exists (SQLite only)
	const cols = await all(`PRAGMA table_info(users)`)
	const hasAvatar = cols?.some(c => c.name === 'avatar')
	if (!hasAvatar) {
		try { await run(`ALTER TABLE users ADD COLUMN avatar TEXT`) } catch {}
	}
}

async function ensurePhotoOptionalColumns() {
	if (isPostgres()) return // PostgreSQL already has all columns
	
	// Ensure photos table has album and metadata columns (SQLite only)
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
