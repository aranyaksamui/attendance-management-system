import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../shared/schema';

const sqlite = new Database('dev.db');
const db = drizzle(sqlite, { schema });

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt INTEGER
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
    semesterId TEXT REFERENCES semesters(id)
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(id),
    rollNo TEXT NOT NULL UNIQUE,
    batchId TEXT REFERENCES batches(id),
    semesterId TEXT REFERENCES semesters(id)
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(id),
    employeeId TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    studentId TEXT REFERENCES students(id),
    subjectId TEXT REFERENCES subjects(id),
    teacherId TEXT REFERENCES teachers(id),
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TEXT
  );
`);

console.log('Database initialized successfully!');
sqlite.close();
