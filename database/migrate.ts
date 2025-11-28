/**
 * Database migration script
 * Run this to create all tables and initial data
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool, closeConnection } from '../src/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  console.log('Starting database migration...');

  try {
    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('Creating tables...');
    await pool.query(schema);
    console.log('✅ Tables created successfully');

    // Read seed file
    const seedPath = join(__dirname, 'seed.sql');
    const seed = readFileSync(seedPath, 'utf8');

    console.log('Seeding data...');
    await pool.query(seed);
    console.log('✅ Data seeded successfully');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nYou can now start the MCP server with: npm start');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

migrate();
