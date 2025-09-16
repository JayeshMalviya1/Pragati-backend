require('dotenv').config();
const { Pool } = require('pg');

/**
 * Centralized Database Configuration for PRAGATI Project
 * 
 * This module provides a singleton database connection pool
 * with proper error handling and connection management.
 */

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection pool
   */
  createPool() {
    if (this.pool) {
      return this.pool;
    }

    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      
      // Connection pool settings
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000,       // 30 seconds
      max: 20,                        // max connections in pool
      min: 2,                         // min connections in pool
      
      // SSL configuration for Supabase
      ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('supabase.co') 
        ? { rejectUnauthorized: false } 
        : false
    };

    this.pool = new Pool(config);

    // Connection event handlers
    this.pool.on('connect', (client) => {
      console.log(`✅ Database connected: ${config.user}@${config.host}:${config.port}/${config.database}`);
      this.isConnected = true;
    });

    this.pool.on('error', (err, client) => {
      console.error('❌ Unexpected database error:', err);
      this.isConnected = false;
    });

    this.pool.on('remove', (client) => {
      console.log('🔌 Database client removed from pool');
    });

    return this.pool;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const client = await this.getPool().connect();
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      console.log('🔍 Database connection test successful');
      console.log(`   Time: ${result.rows[0].current_time}`);
      console.log(`   Version: ${result.rows[0].db_version.split(' ')[0]} ${result.rows[0].db_version.split(' ')[1]}`);
      client.release();
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get database pool instance
   */
  getPool() {
    if (!this.pool) {
      this.createPool();
    }
    return this.pool;
  }

  /**
   * Execute a query with error handling
   */
  async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await this.getPool().query(text, params);
      const duration = Date.now() - start;
      console.log(`📊 Query executed in ${duration}ms`);
      return result;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      console.error('   Query:', text);
      console.error('   Params:', params);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient() {
    return await this.getPool().connect();
  }

  /**
   * Close all database connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔒 Database connections closed');
      this.isConnected = false;
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy() {
    return this.isConnected && this.pool && !this.pool.ended;
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;