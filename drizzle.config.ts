/**
 * Drizzle Configuration
 * 
 * Configures database migrations and schema management
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'pg',
  
  // Database connection
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 
      `postgresql://${process.env.SUPABASE_DB_USER}:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}`,
  },
  
  // Migration settings
  verbose: true,
  strict: true,
  
  // Output options
  
  // Migration naming
});
