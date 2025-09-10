import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// For development, use SQLite instead of Neon to avoid WebSocket issues
let db: any;

async function initializeDatabase() {
  if (process.env.NODE_ENV === 'development') {
    // Use SQLite for development
    const sqlite = new Database('dev.db');
    db = drizzleSqlite(sqlite, { schema });
    console.log('Using SQLite database for development');
  } else if (process.env.DATABASE_URL) {
    const databaseUrl = process.env.DATABASE_URL;
    if (/neon\.tech|neon\.build|neondb\.com/.test(databaseUrl)) {
      // Use Neon driver when the URL points to Neon
      const { drizzle: neonDrizzle } = await import('drizzle-orm/neon-serverless');
      const { Pool, neonConfig } = await import('@neondatabase/serverless');
      const ws = await import('ws');
      neonConfig.webSocketConstructor = ws.default;
      const pool = new Pool({ connectionString: databaseUrl });
      db = neonDrizzle(pool, { schema });
      console.log('Using Neon database');
    } else {
      // Use postgres-js for standard Postgres providers (Render, Railway, etc.)
      const { drizzle: postgresDrizzle } = await import('drizzle-orm/postgres-js');
      const postgres = (await import('postgres')).default;
      const client = postgres(databaseUrl, { ssl: 'require' });
      db = postgresDrizzle(client, { schema });
      
      // Auto-migrate schema on startup
      try {
        console.log('Running database migrations...');
        await migrate(db, { migrationsFolder: './migrations' });
        console.log('Database migrations completed');
      } catch (error) {
        console.warn('Migration failed, trying to create tables directly:', error.message);
        // Fallback: create tables directly if migrations fail
        await createTablesDirectly(client);
      }
      
      console.log('Using postgres-js database');
    }
  } else {
    throw new Error(
      "DATABASE_URL must be set for production. Did you forget to provision a database?",
    );
  }
}

// Fallback function to create tables directly if migrations fail
async function createTablesDirectly(client: any) {
  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      "createdAt" INTEGER
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      "semesterId" TEXT REFERENCES semesters(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      "userId" TEXT REFERENCES users(id),
      "rollNo" TEXT NOT NULL UNIQUE,
      "batchId" TEXT REFERENCES batches(id),
      "semesterId" TEXT REFERENCES semesters(id)
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      "userId" TEXT REFERENCES users(id),
      "employeeId" TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      "studentId" TEXT REFERENCES students(id),
      "subjectId" TEXT REFERENCES subjects(id),
      "teacherId" TEXT REFERENCES teachers(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      "createdAt" TEXT
    );
  `;
  
  try {
    await client.unsafe(createTablesSQL);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Failed to create tables:', error);
    throw error;
  }
}

// Initialize database immediately and export readiness promise
const dbReady = initializeDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
  throw err;
});

export { db, dbReady };