#!/usr/bin/env node

/**
 * Schema-Only Setup Script for PRAGATI Project
 * 
 * This script assumes the database and user already exist
 * and only sets up the schema, tables, and indexes.
 * Use this if you've already created the database manually.
 */

require('dotenv').config();

async function setupSchemaOnly() {
  console.log('🏗️  Setting up PRAGATI database schema...\n');

  try {
    // Import our centralized database modules
    const dbManager = require('../src/config/database');
    const schemaManager = require('../src/config/schema');

    console.log('🔍 Testing database connection...');
    await dbManager.testConnection();
    console.log('✅ Database connection successful');

    console.log('\n🏗️  Initializing database schema...');
    await schemaManager.initializeSchema();

    console.log('\n📊 Getting database statistics...');
    const stats = await schemaManager.getDatabaseStats();
    
    console.log('\n🎉 Schema setup completed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    console.log('\n📊 Table Status:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

    console.log('\n✅ Ready to start the server with: npm start');
    
    await dbManager.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Schema setup failed:', error.message);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n💡 Database does not exist. Please create it first:');
      console.error('   1. Open pgAdmin or use psql');
      console.error('   2. Create database: CREATE DATABASE pragati_db;');
      console.error('   3. Create user: CREATE USER prg_user WITH PASSWORD \'prg_password\';');
      console.error('   4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE pragati_db TO prg_user;');
      console.error('   5. Then run this script again');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Check your database credentials in .env file:');
      console.error('   DB_USER=prg_user');
      console.error('   DB_PASSWORD=prg_password');
      console.error('   DB_NAME=pragati_db');
      console.error('   DB_HOST=localhost');
      console.error('   DB_PORT=5432');
    } else {
      console.error('\n💡 Make sure:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. Database credentials are correct');
      console.error('   3. PostGIS extension is available');
    }
    
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupSchemaOnly();
}

module.exports = setupSchemaOnly;