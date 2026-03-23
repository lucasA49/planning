import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'planning.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'visitor' CHECK(role IN ('admin', 'visitor')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS worksite_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT '#2563eb',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS plannings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,
    location_id INTEGER NOT NULL,
    worksite_type_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (worksite_type_id) REFERENCES worksite_types(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS planning_users (
    planning_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (planning_id, user_id),
    FOREIGN KEY (planning_id) REFERENCES plannings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migration: add start_date / end_date columns to plannings
const cols = db.prepare('PRAGMA table_info(plannings)').all();
if (!cols.some(c => c.name === 'start_date')) {
  db.exec('ALTER TABLE plannings ADD COLUMN start_date TEXT');
  db.exec('ALTER TABLE plannings ADD COLUMN end_date TEXT');
  // migrate existing data: start_date = week_start, end_date = week_start + 6 days
  const rows = db.prepare('SELECT id, week_start FROM plannings WHERE week_start IS NOT NULL').all();
  for (const row of rows) {
    const d = new Date(row.week_start + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    const end = d.toISOString().split('T')[0];
    db.prepare('UPDATE plannings SET start_date = ?, end_date = ? WHERE id = ?').run(row.week_start, end, row.id);
  }
}

// Migration: add day_type column to plannings
if (!cols.some(c => c.name === 'day_type')) {
  db.exec("ALTER TABLE plannings ADD COLUMN day_type TEXT NOT NULL DEFAULT 'full'");
}

export default db;
