require('dotenv').config();
const express = require('express');

// Import centralized database configuration
const dbManager = require('./src/config/database');
const schemaManager = require('./src/config/schema');

// Initialize database and schema on startup
async function initializeDatabase() {
  try {
    console.log('🚀 Starting PRAGATI Backend Server...');
    
    // Test database connection
    await dbManager.testConnection();
    
    // Initialize schema
    await schemaManager.initializeSchema();
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();

const app = express();
app.use(express.json());

// GET villages by bbox (minLon,minLat,maxLon,maxLat)
app.get('/api/villages', async (req, res) => {
  try {
    const { bbox, zoom, limit = 1000 } = req.query;
    
    if (!bbox) {
      return res.status(400).json({ error: 'bbox parameter required (format: minLon,minLat,maxLon,maxLat)' });
    }
    
    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
    
    // Validate bbox parameters
    if ([minLon, minLat, maxLon, maxLat].some(isNaN)) {
      return res.status(400).json({ error: 'Invalid bbox format. Use: minLon,minLat,maxLon,maxLat' });
    }
    
    // For simplified schema without PostGIS, we'll do basic filtering
    // This is a simplified approach - in production you'd want proper spatial indexing
    const sql = `
      SELECT id, gid, name, state, district, block, properties, boundary_geojson,
             centroid_lat, centroid_lon, created_at
      FROM villages
      WHERE (centroid_lat BETWEEN $1 AND $2 OR centroid_lat IS NULL)
        AND (centroid_lon BETWEEN $3 AND $4 OR centroid_lon IS NULL)
      ORDER BY name
      LIMIT $5;
    `;
    
    const { rows } = await dbManager.query(sql, [minLat, maxLat, minLon, maxLon, parseInt(limit)]);
    
    const features = rows.map(r => ({
      type: 'Feature',
      properties: { 
        id: r.id, 
        gid: r.gid,
        name: r.name, 
        state: r.state,
        district: r.district, 
        block: r.block,
        properties: r.properties,
        centroid_lat: r.centroid_lat,
        centroid_lon: r.centroid_lon,
        created_at: r.created_at
      },
      geometry: r.boundary_geojson || null
    }));
    
    res.json({ 
      type: 'FeatureCollection', 
      features,
      count: features.length,
      bbox: [minLon, minLat, maxLon, maxLat]
    });
  } catch (err) {
    console.error('Villages API Error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// POST claim (store OCR structured JSON and optionally geometry)
app.post('/api/claims', async (req, res) => {
  try {
    const { name, claimant_type, tribal_group, village_name, area_ha, geometry, properties } = req.body;
    
    // Validate required fields
    if (!name || !claimant_type) {
      return res.status(400).json({ error: 'name and claimant_type are required' });
    }
    
    // Validate claimant_type
    if (!['IFR', 'CR'].includes(claimant_type)) {
      return res.status(400).json({ error: 'claimant_type must be IFR or CR' });
    }
    
    // Find village id by name (improve by using village id when available)
    let village_id = null;
    if (village_name) {
      const v = await dbManager.query('SELECT id FROM villages WHERE name ILIKE $1 LIMIT 1', [village_name]);
      village_id = v.rows[0] ? v.rows[0].id : null;
    }
    
    // Insert claim with simplified schema
    const insertSql = `
      INSERT INTO claimants (name, claimant_type, tribal_group, village_id, area_ha, geometry_geojson, properties)
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;
    
    const params = [
      name, 
      claimant_type, 
      tribal_group, 
      village_id, 
      area_ha, 
      geometry ? JSON.stringify(geometry) : null,
      properties || {}
    ];
    
    const result = await dbManager.query(insertSql, params);
    
    res.json({ 
      success: true, 
      claim: result.rows[0],
      village_found: village_id !== null
    });
  } catch (err) {
    console.error('Claims API Error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// GET villages by name search
app.get('/api/villages/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'q parameter required for search' });
    }
    
    const sql = `
      SELECT id, gid, name, state, district, block, properties,
             centroid_lat, centroid_lon, created_at
      FROM villages
      WHERE name ILIKE $1 OR district ILIKE $1 OR block ILIKE $1
      ORDER BY 
        CASE 
          WHEN name ILIKE $1 THEN 1
          WHEN district ILIKE $1 THEN 2
          ELSE 3
        END,
        name
      LIMIT $2;
    `;
    
    const searchTerm = `%${q}%`;
    const { rows } = await dbManager.query(sql, [searchTerm, parseInt(limit)]);
    
    res.json({
      query: q,
      count: rows.length,
      villages: rows
    });
  } catch (err) {
    console.error('Search API Error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = await schemaManager.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await schemaManager.getDatabaseStats();
    res.json({
      database: process.env.DB_NAME || 'pragati_db',
      user: process.env.DB_USER || 'prg_user',
      tables: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database statistics' });
  }
});

// GET claimants with filtering
app.get('/api/claimants', async (req, res) => {
  try {
    const { village_id, claimant_type, status, limit = 50 } = req.query;
    
    let sql = `
      SELECT c.*, v.name as village_name, v.district
      FROM claimants c
      LEFT JOIN villages v ON c.village_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (village_id) {
      paramCount++;
      sql += ` AND c.village_id = $${paramCount}`;
      params.push(village_id);
    }
    
    if (claimant_type) {
      paramCount++;
      sql += ` AND c.claimant_type = $${paramCount}`;
      params.push(claimant_type);
    }
    
    if (status) {
      paramCount++;
      sql += ` AND c.status = $${paramCount}`;
      params.push(status);
    }
    
    paramCount++;
    sql += ` ORDER BY c.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const { rows } = await dbManager.query(sql, params);
    
    res.json({
      claimants: rows,
      count: rows.length,
      filters: { village_id, claimant_type, status }
    });
  } catch (err) {
    console.error('Claimants API Error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// GET micro assets
app.get('/api/assets', async (req, res) => {
  try {
    const { village_id, asset_type, district, limit = 50 } = req.query;
    
    let sql = `
      SELECT a.*, v.name as village_name
      FROM micro_assets a
      LEFT JOIN villages v ON a.village_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (village_id) {
      paramCount++;
      sql += ` AND a.village_id = $${paramCount}`;
      params.push(village_id);
    }
    
    if (asset_type) {
      paramCount++;
      sql += ` AND a.asset_type = $${paramCount}`;
      params.push(asset_type);
    }
    
    if (district) {
      paramCount++;
      sql += ` AND a.district ILIKE $${paramCount}`;
      params.push(`%${district}%`);
    }
    
    paramCount++;
    sql += ` ORDER BY a.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const { rows } = await dbManager.query(sql, params);
    
    res.json({
      assets: rows,
      count: rows.length,
      filters: { village_id, asset_type, district }
    });
  } catch (err) {
    console.error('Assets API Error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// GET documents
app.get('/api/documents', async (req, res) => {
  try {
    const { claimant_id, limit = 20 } = req.query;
    
    let sql = `
      SELECT d.*, c.name as claimant_name
      FROM documents d
      LEFT JOIN claimants c ON d.claimant_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (claimant_id) {
      paramCount++;
      sql += ` AND d.claimant_id = $${paramCount}`;
      params.push(claimant_id);
    }
    
    paramCount++;
    sql += ` ORDER BY d.uploaded_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const { rows } = await dbManager.query(sql, params);
    
    res.json({
      documents: rows,
      count: rows.length,
      filters: { claimant_id }
    });
  } catch (err) {
    console.error('Documents API Error:', err);
    res.status(500).json({ error: 'server error', details: err.message });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await dbManager.close();
  process.exit(0);
});

const port = process.env.PORT || 4000;

// For Vercel, export the app instead of listening
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🌐 PRAGATI API Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`📈 Statistics: http://localhost:${port}/api/stats`);
  });
}

// Export for Vercel
module.exports = app;
