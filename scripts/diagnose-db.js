#!/usr/bin/env node

/**
 * Database Diagnostic Script for PRAGATI Project
 * 
 * This script helps diagnose database connectivity issues
 * and provides information about existing databases and users.
 */

require('dotenv').config();
const { Client } = require('pg');

async function diagnoseDatabaseSetup() {
  console.log('🔍 Diagnosing database setup...\n');

  // Test different common configurations
  const testConfigs = [
    {
      name: 'Current .env config (prg_user)',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'pragati_db',
        user: process.env.DB_USER || 'prg_user',
        password: process.env.DB_PASSWORD || 'root'
      }
    },
    {
      name: 'Default postgres user',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'postgres'
      }
    },
    {
      name: 'Default postgres user with root password',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'root'
      }
    },
    {
      name: 'pragati_db with postgres user',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: 'pragati_db',
        user: 'postgres',
        password: 'root'
      }
    }
  ];

  for (const testConfig of testConfigs) {
    console.log(`🧪 Testing: ${testConfig.name}`);
    console.log(`   ${testConfig.config.user}@${testConfig.config.host}:${testConfig.config.port}/${testConfig.config.database}`);
    
    try {
      const client = new Client(testConfig.config);
      await client.connect();
      
      console.log('   ✅ Connection successful!');
      
      // If connected, try to get some info
      try {
        const result = await client.query('SELECT current_database(), current_user, version()');
        console.log(`   📊 Database: ${result.rows[0].current_database}`);
        console.log(`   👤 User: ${result.rows[0].current_user}`);
        console.log(`   🗄️  Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
        
        // Check if PostGIS is available
        try {
          await client.query('SELECT PostGIS_Version()');
          console.log('   🌍 PostGIS: Available');
        } catch (e) {
          console.log('   🌍 PostGIS: Not available');
        }
        
        // List databases if connected as superuser
        if (testConfig.config.user === 'postgres') {
          try {
            const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
            console.log('   🗄️  Databases:', dbResult.rows.map(r => r.datname).join(', '));
          } catch (e) {
            console.log('   🗄️  Could not list databases');
          }
          
          // List users
          try {
            const userResult = await client.query('SELECT rolname FROM pg_roles WHERE rolcanlogin = true');
            console.log('   👥 Users:', userResult.rows.map(r => r.rolname).join(', '));
          } catch (e) {
            console.log('   👥 Could not list users');
          }
        }
        
      } catch (queryError) {
        console.log('   ⚠️  Connected but query failed:', queryError.message);
      }
      
      await client.end();
      console.log('   ✅ This configuration works!\n');
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('🎯 Recommendations:');
  console.log('1. Use a working configuration from above');
  console.log('2. Update your .env file with the correct credentials');
  console.log('3. If no configuration works, check if PostgreSQL is running');
  console.log('4. If prg_user doesn\'t exist, create it using a working postgres connection');
}

// Run the diagnostic
if (require.main === module) {
  diagnoseDatabaseSetup().catch(console.error);
}

module.exports = diagnoseDatabaseSetup;