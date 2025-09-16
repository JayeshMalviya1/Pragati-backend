require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('Attempting to connect to the database...');
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT 1+1 as result');
    console.log('Test query result:', result.rows[0]);
    
    // List all tables
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('\nTables in the database:');
    console.table(tables.rows);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
