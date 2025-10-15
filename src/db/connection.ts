import postgres from 'postgres';

export type Sql = ReturnType<typeof postgres>;

/**
 * Create PostgreSQL database connection
 * Pure function that returns a configured postgres client
 *
 * @param databaseUrl - PostgreSQL connection string
 * @returns Configured postgres SQL client with camelCase conversion
 */
export function createDbConnection(databaseUrl: string): Sql {
  const sql = postgres(databaseUrl, {
    // Enable automatic snake_case to camelCase conversion
    transform: postgres.camel,
    // Connection pool configuration
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return sql;
}

/**
 * Shared database connection instance
 * Initialized lazily on first use
 */
let dbInstance: Sql | null = null;

/**
 * Get or create the database connection
 * @param databaseUrl - PostgreSQL connection string
 * @returns Shared database connection
 */
export function getDb(databaseUrl: string): Sql {
  if (!dbInstance) {
    dbInstance = createDbConnection(databaseUrl);
  }
  return dbInstance;
}

/**
 * Close database connection
 * Used for graceful shutdown
 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.end();
    dbInstance = null;
  }
}
