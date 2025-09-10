import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

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
      // Use node-postgres for standard Postgres providers (Render, Railway, etc.)
      const { drizzle: pgDrizzle } = await import('drizzle-orm/node-postgres');
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
      db = pgDrizzle(pool, { schema });
      console.log('Using node-postgres database');
    }
  } else {
    throw new Error(
      "DATABASE_URL must be set for production. Did you forget to provision a database?",
    );
  }
}

// Initialize database immediately
initializeDatabase().catch(console.error);

export { db };