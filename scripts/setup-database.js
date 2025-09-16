#!/usr/bin/env node

/**
 * Database Setup Script for PRAGATI Project
 * 
 * This script helps set up the centralized PostgreSQL database
 * with proper user, database, and schema configuration.
 */

require('dotenv').config();
const { Client } = require('pg');

async function setupDatabase() {
  console.log('🏗️  Setting up PRAGATI centralized database...\n');

  // Connect as superuser to create database and user
  // Use the working postgres credentials we discovered
  const postgresPassword = 'root'; // From diagnostic, this is the working password
  
  console.log(`🔐 Connecting as postgres superuser...`);
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}:${parseInt(process.env.DB_PORT) || 5432}`);
  console.log(`   Database: postgres`);
  console.log(`   User: postgres`);
  
  const superuserClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',     // Using postgres superuser
    password: postgresPassword
  });

  try {
    await superuserClient.connect();
    console.log('✅ Connected to PostgreSQL as superuser');

    // Create user if not exists
    console.log('\n👤 Creating database user...');
    try {
      await superuserClient.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prg_user') THEN
            CREATE USER prg_user WITH PASSWORD 'prg_password';
            RAISE NOTICE 'User prg_user created';
          ELSE
            RAISE NOTICE 'User prg_user already exists';
          END IF;
        END
        $$;
      `);
      console.log('✅ Database user configured');
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
    }

    // Create database if not exists
    console.log('\n🗄️  Creating database...');
    try {
      // Check if database exists first
      const dbExists = await superuserClient.query(
        "SELECT 1 FROM pg_database WHERE datname = 'pragati_db'"
      );
      
      if (dbExists.rows.length === 0) {
        await superuserClient.query('CREATE DATABASE pragati_db OWNER prg_user');
        console.log('✅ Database pragati_db created');
      } else {
        console.log('✅ Database pragati_db already exists');
      }
    } catch (error) {
      console.error('❌ Error creating database:', error.message);
    }

    // Grant privileges
    console.log('\n🔐 Setting up permissions...');
    try {
      await superuserClient.query('GRANT ALL PRIVILEGES ON DATABASE pragati_db TO prg_user');
      console.log('✅ Privileges granted to prg_user');
    } catch (error) {
      console.error('❌ Error granting privileges:', error.message);
    }

    await superuserClient.end();

    // Now connect as the application user to set up schema
    console.log('\n🏗️  Setting up database schema...');
    const dbManager = require('../src/config/database');
    const schemaManager = require('../src/config/schema');

    await dbManager.testConnection();
    await schemaManager.initializeSchema();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log('   Database: pragati_db');
    console.log('   User: prg_user');
    console.log('   Host: localhost:5432');
    console.log('   Extensions: PostGIS, pg_trgm, btree_gist');
    
    const stats = await schemaManager.getDatabaseStats();
    console.log('\n📊 Table Status:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

    await dbManager.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n🔐 Authentication Error Solutions:');
      console.error('   1. Set the correct postgres password in environment:');
      console.error('      export POSTGRES_PASSWORD=your_actual_password');
      console.error('   2. Or update your .env file:');
      console.error('      POSTGRES_PASSWORD=your_actual_password');
      console.error('   3. Or run setup manually using pgAdmin or psql:');
      console.error('      psql -U postgres -c "CREATE USER prg_user WITH PASSWORD \'prg_password\';"');
      console.error('      psql -U postgres -c "CREATE DATABASE pragati_db OWNER prg_user;"');
      console.error('      psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pragati_db TO prg_user;"');
    } else {
      console.error('\n💡 General troubleshooting:');
      console.error('   1. PostgreSQL is running on localhost:5432');
      console.error('   2. You have superuser access (postgres user)');
      console.error('   3. PostGIS extension is available');
    }
    
    console.error('\n🔧 Alternative: Try manual setup first, then run:');
    console.error('   npm start  # This will initialize the schema automatically');
    
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;