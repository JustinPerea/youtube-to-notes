/**
 * Blog Migration Script
 * Runs the blog table migration using the existing database connection
 */

import { db } from '../lib/db/connection';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('🚀 Starting blog table migration...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'migrate-blog-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements (rough split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        await db.execute(sql.raw(statement));
      }
    }
    
    console.log('✅ Blog migration completed successfully!');
    console.log('🎯 You can now:');
    console.log('   • Visit /blog to see the blog page');
    console.log('   • Use /admin/simple to create blog posts');
    console.log('   • Blog tables are ready in your database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();