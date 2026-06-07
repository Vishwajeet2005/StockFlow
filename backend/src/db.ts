import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data/inventory.db');
const DATA_DIR = path.dirname(DB_PATH);

let db: Database;

export async function initDB(): Promise<Database> {
  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    totp_secret TEXT,
    totp_enabled INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TEXT,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    product_code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    weight REAL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    quantity REAL NOT NULL DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    party_id TEXT DEFAULT '',
    party_name TEXT DEFAULT '',
    products TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'quotation',
    date TEXT DEFAULT (datetime('now')),
    notes TEXT DEFAULT '',
    total_amount REAL DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS manufacturing (
    batch_id TEXT PRIMARY KEY,
    batch_number TEXT NOT NULL,
    raw_materials TEXT NOT NULL DEFAULT '[]',
    output TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'in_progress',
    notes TEXT DEFAULT '',
    start_date TEXT DEFAULT (datetime('now')),
    end_date TEXT,
    last_updated TEXT DEFAULT (datetime('now'))
  );`);

  // Seed admin user if none — password is logged ONLY in development for initial setup
  const userCount = queryOne('SELECT COUNT(*) as count FROM users') as { count: number };
  if (!userCount || userCount.count === 0) {
    const hash = bcrypt.hashSync('Admin@123', 12);
    runSQL('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Default user created: admin / Admin@123 (change this password immediately!)');
    }
  }

  // No sample data seeded anymore as requested.

  persist();
  console.log('✅ Database ready');
  return db;
}

export function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function runSQL(sql: string, params: any[] = []) {
  db.run(sql, params);
  persist();
}

export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

export function queryOne(sql: string, params: any[] = []): any | null {
  return queryAll(sql, params)[0] || null;
}
