import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'exports');
const DB_PATH = path.resolve(process.cwd(), 'dev.db');

const TABLES_IN_ORDER = [
  'users',
  'batches',
  'semesters',
  'subjects',
  'teachers',
  'students',
  'attendance',
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function exportTable(db: Database.Database, table: string) {
  const csvPath = path.join(OUTPUT_DIR, `${table}.csv`);

  const pragma: any[] = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  if (!pragma || pragma.length === 0) {
    console.warn(`Skipping ${table}: no columns found`);
    return;
  }
  const columns: string[] = pragma.map((c: any) => c.name as string);

  const rows = db
    .prepare(`SELECT * FROM ${table}`)
    .all() as Array<Record<string, unknown>>;

  const lines: string[] = [];
  // header
  lines.push(columns.join(','));
  // body
  for (const row of rows) {
    const vals = columns.map((col) => {
      const v = row[col];
      if (v === null || v === undefined) return '';
      const s = String(v);
      // Escape CSV field
      const needsQuote = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuote ? `"${escaped}"` : escaped;
    });
    lines.push(vals.join(','));
  }

  fs.writeFileSync(csvPath, lines.join('\n'), 'utf-8');
  console.log(`Wrote ${csvPath} (${rows.length} rows)`);
}

function main() {
  ensureDir(OUTPUT_DIR);
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Could not find ${DB_PATH}. Run the app in development to generate dev.db.`);
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  try {
    for (const table of TABLES_IN_ORDER) {
      try {
        exportTable(db, table);
      } catch (e) {
        console.warn(`Failed to export ${table}:`, e);
      }
    }
  } finally {
    db.close();
  }
}

main();
