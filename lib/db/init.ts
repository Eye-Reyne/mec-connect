// lib/db/init.ts
import * as SQLite from 'expo-sqlite';
import { createTablesSQL } from './schema';

// Database version
const DATABASE_VERSION = 1;
const DATABASE_NAME = 'mec_connect_app.db';

/**
 * Open and initialize the database
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initDatabase(db);
  return db;
}

/**
 * Initialize the database with required tables
 */
export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Get the current database version
    const result = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );
    const currentDbVersion = result?.user_version ?? 0;

    // Skip initialization if database is already at the correct version
    if (currentDbVersion >= DATABASE_VERSION) {
      console.log('Database already at version', currentDbVersion);
      return;
    }

    console.log('Initializing database version', DATABASE_VERSION);

    // Enable WAL journal mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL');
    
    // Enable foreign keys support
    await db.execAsync('PRAGMA foreign_keys = ON');

    // Create all tables
    await db.execAsync(createTablesSQL);

    // Set the database version
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Database migrator function for the SQLiteProvider
 */
export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await initDatabase(db);
}
