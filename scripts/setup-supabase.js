#!/usr/bin/env node

/**
 * Supabase Setup Script for PRAGATI Project
 * 
 * This script sets up the database schema on Supabase
 * and imports the village data from OR.json
 */

require('dotenv').config();

async function setupSupabase() {
  console.log('🚀 Setting up PRAGATI on Supabase...\n');

  try {
    // Import our centralized database modules
    const dbManager = require('../src/config/database');
    const schemaManager = require('../src/config/schema');

    console.log('🔍 Testing Supabase connection...');
    await dbManager.testConnection();
    console.log('✅ Supabase connection successful');

    console.log('\n🏗️  Setting up database schema...');
    await schemaManager.initializeSchema();
    console.log('✅ Schema setup completed');

    console.log('\n📊 Checking current data...');
    const stats = await schemaManager.getDatabaseStats();
    
    console.log('\n📋 Supabase Setup Summary:');
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   SSL: ${process.env.DB_SSL || 'enabled'}`);
    
    console.log('\n📊 Table Status:');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });

    if (stats.villages === 0) {
      console.log('\n💡 Next step: Import village data with:');
      console.log('   npm run import-villages');
    } else {
      console.log('\n✅ Village data already imported!');
    }

    await dbManager.close();
    console.log('\n🎉 Supabase setup completed successfully!');

  } catch (error) {
    console.error('\n❌ Supabase setup failed:', error.message);
    
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\n💡 Connection Error Solutions:');
      console.error('   1. Check your Supabase project URL in .env file');
      console.error('   2. Verify DB_HOST format: db.[YOUR-PROJECT-ID].supabase.co');
      console.error('   3. Ensure your Supabase password is correct');
      console.error('   4. Check if your IP is allowed in Supabase dashboard');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Authentication Error Solutions:');
      console.error('   1. Check DB_PASSWORD in .env file');
      console.error('   2. Verify password in Supabase dashboard > Settings > Database');
      console.error('   3. Make sure you\'re using the postgres user password');
    } else if (error.message.includes('permission denied')) {
      console.error('\n💡 Permission Error Solutions:');
      console.error('   1. Enable PostGIS extension in Supabase dashboard');
      console.error('   2. Go to SQL Editor and run: CREATE EXTENSION IF NOT EXISTS postgis;');
    }
    
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupSupabase();
}

module.exports = setupSupabase;