import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { Sql } from './connection.js';

/**
 * Migration record in database
 */
interface MigrationRecord {
  id: number;
  name: string;
  appliedAt: Date;
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(db: Sql): Promise<void> {
  await db`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(db: Sql): Promise<Set<string>> {
  const rows = await db<MigrationRecord[]>`
    SELECT name FROM migrations ORDER BY id
  `;
  return new Set(rows.map(row => row.name));
}

/**
 * Record migration as applied
 */
async function recordMigration(db: Sql, name: string): Promise<void> {
  await db`
    INSERT INTO migrations (name) VALUES (${name})
  `;
}

/**
 * Get list of migration files from migrations directory
 */
async function getMigrationFiles(migrationsDir: string): Promise<string[]> {
  const files = await readdir(migrationsDir);
  return files
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure alphabetical order (001_, 002_, etc.)
}

/**
 * Run all pending database migrations
 * Idempotent - safe to run multiple times
 *
 * @param db - Database connection
 * @param migrationsDir - Path to migrations directory (default: ./migrations)
 */
export async function runMigrations(
  db: Sql,
  migrationsDir: string = join(process.cwd(), 'migrations')
): Promise<void> {
  console.log('🔄 Running database migrations...');

  // Ensure migrations table exists
  await ensureMigrationsTable(db);

  // Get applied migrations
  const applied = await getAppliedMigrations(db);
  console.log(`✓ Found ${applied.size} applied migrations`);

  // Get migration files
  const migrationFiles = await getMigrationFiles(migrationsDir);
  console.log(`✓ Found ${migrationFiles.length} migration files`);

  // Run pending migrations
  let appliedCount = 0;
  for (const filename of migrationFiles) {
    if (applied.has(filename)) {
      continue; // Already applied
    }

    const filepath = join(migrationsDir, filename);
    const sql = await readFile(filepath, 'utf-8');

    console.log(`  → Applying ${filename}...`);

    // Execute migration in a transaction
    await db.begin(async (tx) => {
      // Execute the migration SQL
      await tx.unsafe(sql);
      // Record the migration
      await recordMigration(tx, filename);
    });

    console.log(`  ✓ Applied ${filename}`);
    appliedCount++;
  }

  if (appliedCount === 0) {
    console.log('✓ No new migrations to apply');
  } else {
    console.log(`✅ Applied ${appliedCount} new migrations`);
  }
}

/**
 * Main entry point for running migrations standalone
 * Usage: npm run migrate
 */
async function main(): Promise<void> {
  const { getDb } = await import('./connection.js');
  const { getEnv } = await import('../config/env.js');

  try {
    const env = getEnv();
    const db = getDb(env.DATABASE_URL);
    await runMigrations(db);
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
