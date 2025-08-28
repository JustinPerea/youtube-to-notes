/**
 * Database Connection Setup
 * 
 * Configures Drizzle ORM with Supabase PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection configuration
let client: any = null;
let db: any = null;

// Only create database connection if environment variables are properly configured
if (process.env.DATABASE_URL || (process.env.SUPABASE_DB_USER && process.env.SUPABASE_DB_PASSWORD)) {
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`;

  try {
    client = postgres(connectionString, {
      max: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    db = drizzle(client, { schema });
  } catch (error) {
    console.warn('Database connection failed:', error);
  }
} else {
  console.warn('Database environment variables not configured. Notes storage will be disabled.');
}

// Health check function
export async function checkDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { 
      success: false, 
      error: 'Database not configured. Please set up environment variables.' 
    };
  }
  
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

// Export db instance
export { db };
