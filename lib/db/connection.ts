/**
 * Database Connection Setup
 * 
 * Configures Drizzle ORM with Supabase PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`;

// Create postgres connection
const client = postgres(connectionString, {
  max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Health check function
export async function checkDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await client`SELECT 1`;
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}

// Close database connection
export async function closeDatabaseConnection(): Promise<void> {
  await client.end();
}

// Export client for direct queries if needed
export { client as postgresClient };
