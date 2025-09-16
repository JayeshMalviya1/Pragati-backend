const dbManager = require('./database');

/**
 * Database Schema Management for PRAGATI Project
 * 
 * This module handles database schema operations, migrations,
 * and provides utility functions for database structure management.
 */

class SchemaManager {
  
  /**
   * Initialize database schema and extensions
   */
  async initializeSchema() {
    console.log('🏗️  Initializing database schema...');
    
    try {
      // Enable required extensions
      await this.enableExtensions();
      
      // Create tables if they don't exist
      await this.createTables();
      
      // Create indexes
      await this.createIndexes();
      
      // Create triggers
      await this.createTriggers();
      
      console.log('✅ Database schema initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Schema initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Enable PostGIS and other required extensions
   */
  async enableExtensions() {
    const extensions = [
      { name: 'pg_trgm', required: false },
      { name: 'btree_gist', required: false },
      { name: 'postgis', required: false },
      { name: 'postgis_topology', required: false }
    ];

    let postgisAvailable = false;

    for (const ext of extensions) {
      try {
        await dbManager.query(`CREATE EXTENSION IF NOT EXISTS ${ext.name}`);
        console.log(`   ✓ Extension enabled: ${ext.name}`);
        if (ext.name === 'postgis') {
          postgisAvailable = true;
        }
      } catch (error) {
        if (ext.required) {
          throw error;
        }
        console.warn(`   ⚠️  Extension ${ext.name} not available: ${error.message}`);
      }
    }

    // Store PostGIS availability for later use
    this.postgisAvailable = postgisAvailable;
    
    if (!postgisAvailable) {
      console.log('   ℹ️  PostGIS not available - using simplified geometry storage');
    }
  }

  /**
   * Create all required tables
   */
  async createTables() {
    const tables = [
      this.createVillagesTable(),
      this.createClaimantsTable(),
      this.createMicroAssetsTable(),
      this.createDocumentsTable(),
      this.createUsersTable()
    ];

    for (const tableQuery of tables) {
      await dbManager.query(tableQuery);
    }
    console.log('   ✓ All tables created/verified');
  }

  /**
   * Villages table schema
   */
  createVillagesTable() {
    if (this.postgisAvailable) {
      return `
        CREATE TABLE IF NOT EXISTS villages (
          id SERIAL PRIMARY KEY,
          gid TEXT,
          name TEXT NOT NULL,
          state TEXT,
          district TEXT,
          block TEXT,
          properties JSONB DEFAULT '{}',
          boundary GEOMETRY(MULTIPOLYGON, 4326),
          centroid GEOMETRY(POINT, 4326),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    } else {
      return `
        CREATE TABLE IF NOT EXISTS villages (
          id SERIAL PRIMARY KEY,
          gid TEXT,
          name TEXT NOT NULL,
          state TEXT,
          district TEXT,
          block TEXT,
          properties JSONB DEFAULT '{}',
          boundary_geojson JSONB,
          centroid_lat NUMERIC(10, 8),
          centroid_lon NUMERIC(11, 8),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    }
  }

  /**
   * Claimants table schema
   */
  createClaimantsTable() {
    if (this.postgisAvailable) {
      return `
        CREATE TABLE IF NOT EXISTS claimants (
          id SERIAL PRIMARY KEY,
          claimant_uuid UUID DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          claimant_type TEXT CHECK (claimant_type IN ('IFR', 'CR')),
          tribal_group TEXT,
          village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
          area_ha NUMERIC(10,4),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recognized', 'rejected')),
          geom GEOMETRY(GEOMETRY, 4326),
          properties JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    } else {
      return `
        CREATE TABLE IF NOT EXISTS claimants (
          id SERIAL PRIMARY KEY,
          claimant_uuid UUID DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          claimant_type TEXT CHECK (claimant_type IN ('IFR', 'CR')),
          tribal_group TEXT,
          village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
          area_ha NUMERIC(10,4),
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recognized', 'rejected')),
          geometry_geojson JSONB,
          properties JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    }
  }

  /**
   * Micro assets table schema
   */
  createMicroAssetsTable() {
    if (this.postgisAvailable) {
      return `
        CREATE TABLE IF NOT EXISTS micro_assets (
          id SERIAL PRIMARY KEY,
          asset_uuid UUID DEFAULT gen_random_uuid(),
          name TEXT,
          asset_type TEXT CHECK (asset_type IN ('water_body', 'vegetation', 'farmland', 'infrastructure')),
          village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
          district TEXT,
          area_ha NUMERIC(10,4),
          status TEXT DEFAULT 'active',
          geom GEOMETRY(GEOMETRY, 4326),
          properties JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    } else {
      return `
        CREATE TABLE IF NOT EXISTS micro_assets (
          id SERIAL PRIMARY KEY,
          asset_uuid UUID DEFAULT gen_random_uuid(),
          name TEXT,
          asset_type TEXT CHECK (asset_type IN ('water_body', 'vegetation', 'farmland', 'infrastructure')),
          village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
          district TEXT,
          area_ha NUMERIC(10,4),
          status TEXT DEFAULT 'active',
          geometry_geojson JSONB,
          properties JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    }
  }

  /**
   * Documents table schema
   */
  createDocumentsTable() {
    return `
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        doc_uuid UUID DEFAULT gen_random_uuid(),
        claimant_id INTEGER REFERENCES claimants(id) ON DELETE SET NULL,
        filename TEXT,
        file_path TEXT,
        raw_text TEXT,
        structured JSONB DEFAULT '{}',
        ocr_confidence NUMERIC(5,4),
        uploaded_by TEXT,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
  }

  /**
   * Users table schema
   */
  createUsersTable() {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
        password_hash TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `;
  }

  /**
   * Create database indexes for performance
   */
  async createIndexes() {
    const indexes = [];
    
    if (this.postgisAvailable) {
      indexes.push(
        'CREATE INDEX IF NOT EXISTS idx_villages_boundary_gist ON villages USING GIST(boundary)',
        'CREATE INDEX IF NOT EXISTS idx_villages_centroid ON villages USING GIST(centroid)',
        'CREATE INDEX IF NOT EXISTS idx_claimants_geom_gist ON claimants USING GIST(geom)',
        'CREATE INDEX IF NOT EXISTS idx_micro_assets_geom_gist ON micro_assets USING GIST(geom)'
      );
    } else {
      indexes.push(
        'CREATE INDEX IF NOT EXISTS idx_villages_centroid_lat ON villages(centroid_lat)',
        'CREATE INDEX IF NOT EXISTS idx_villages_centroid_lon ON villages(centroid_lon)',
        'CREATE INDEX IF NOT EXISTS idx_villages_boundary_geojson ON villages USING GIN(boundary_geojson)',
        'CREATE INDEX IF NOT EXISTS idx_claimants_geometry_geojson ON claimants USING GIN(geometry_geojson)',
        'CREATE INDEX IF NOT EXISTS idx_micro_assets_geometry_geojson ON micro_assets USING GIN(geometry_geojson)'
      );
    }
    
    // Common indexes
    indexes.push(
      'CREATE INDEX IF NOT EXISTS idx_villages_district ON villages(district)',
      'CREATE INDEX IF NOT EXISTS idx_claimants_village_id ON claimants(village_id)',
      'CREATE INDEX IF NOT EXISTS idx_claimants_type ON claimants(claimant_type)',
      'CREATE INDEX IF NOT EXISTS idx_claimants_status ON claimants(status)',
      'CREATE INDEX IF NOT EXISTS idx_micro_assets_village_id ON micro_assets(village_id)',
      'CREATE INDEX IF NOT EXISTS idx_micro_assets_type ON micro_assets(asset_type)',
      'CREATE INDEX IF NOT EXISTS idx_documents_claimant_id ON documents(claimant_id)',
      'CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename)'
    );
    
    // Text search index if pg_trgm is available
    try {
      await dbManager.query('CREATE INDEX IF NOT EXISTS idx_villages_name_trgm ON villages USING GIN(name gin_trgm_ops)');
      indexes.push('-- Text search index created');
    } catch (error) {
      indexes.push('CREATE INDEX IF NOT EXISTS idx_villages_name ON villages(name)');
    }

    for (const indexQuery of indexes) {
      if (indexQuery.startsWith('--')) continue; // Skip comments
      try {
        await dbManager.query(indexQuery);
      } catch (error) {
        console.warn(`   ⚠️  Index creation warning: ${error.message}`);
      }
    }
    console.log('   ✓ All indexes created/verified');
  }

  /**
   * Create database triggers
   */
  async createTriggers() {
    if (this.postgisAvailable) {
      // Function to update village centroid with PostGIS
      await dbManager.query(`
        CREATE OR REPLACE FUNCTION update_village_centroid() 
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.centroid = ST_Centroid(NEW.boundary);
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);

      // Trigger for village centroid updates
      await dbManager.query(`
        DROP TRIGGER IF EXISTS trg_update_village_centroid ON villages;
        CREATE TRIGGER trg_update_village_centroid
          BEFORE INSERT OR UPDATE ON villages
          FOR EACH ROW EXECUTE FUNCTION update_village_centroid()
      `);
    } else {
      // Function to update village centroid without PostGIS
      await dbManager.query(`
        CREATE OR REPLACE FUNCTION update_village_centroid_simple() 
        RETURNS TRIGGER AS $$
        BEGIN
          -- Extract centroid from GeoJSON if available
          IF NEW.boundary_geojson IS NOT NULL THEN
            -- Simple centroid calculation would go here
            -- For now, just update the timestamp
            NEW.updated_at = NOW();
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);

      // Trigger for village updates
      await dbManager.query(`
        DROP TRIGGER IF EXISTS trg_update_village_centroid_simple ON villages;
        CREATE TRIGGER trg_update_village_centroid_simple
          BEFORE INSERT OR UPDATE ON villages
          FOR EACH ROW EXECUTE FUNCTION update_village_centroid_simple()
      `);
    }

    // Function to update timestamps
    await dbManager.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Triggers for updated_at columns
    const tables = ['claimants', 'micro_assets'];
    for (const table of tables) {
      await dbManager.query(`
        DROP TRIGGER IF EXISTS trg_update_${table}_updated_at ON ${table};
        CREATE TRIGGER trg_update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
    }

    console.log('   ✓ All triggers created/verified');
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const stats = {};
    
    const tables = ['villages', 'claimants', 'micro_assets', 'documents', 'users'];
    
    for (const table of tables) {
      try {
        const result = await dbManager.query(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = parseInt(result.rows[0].count);
      } catch (error) {
        stats[table] = 'Error';
      }
    }
    
    return stats;
  }

  /**
   * Check database health
   */
  async checkHealth() {
    try {
      await dbManager.query('SELECT 1');
      const stats = await this.getDatabaseStats();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tables: stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new SchemaManager();