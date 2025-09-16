#!/usr/bin/env node

/**
 * Village Data Import Script for PRAGATI Project
 * 
 * This script imports village boundary data from OC.json
 * into the centralized PostgreSQL database.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dbManager = require('../src/config/database');

async function importVillages() {
  console.log('📥 Starting village data import to Supabase...\n');

  try {
    // Read the OR.json file
    const dataPath = path.join(__dirname, '../data/OR.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found: ${dataPath}`);
    }

    console.log('📖 Reading village data from OR.json...');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const geoData = JSON.parse(rawData);

    if (!geoData.features || !Array.isArray(geoData.features)) {
      throw new Error('Invalid GeoJSON format: missing features array');
    }

    console.log(`✅ Found ${geoData.features.length} village features`);

    // Connect to database
    await dbManager.testConnection();

    // Import each village
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const feature of geoData.features) {
      try {
        const { properties, geometry } = feature;
        
        // Extract village information
        const villageData = {
          gid: properties.gid || null,
          name: properties.name || properties.NAME || 'Unknown',
          state: properties.state || properties.STATE || null,
          district: properties.district || properties.DISTRICT || null,
          block: properties.block || properties.BLOCK || null,
          properties: properties
        };

        // Check if village already exists
        const existingVillage = await dbManager.query(
          'SELECT id FROM villages WHERE gid = $1 OR (name = $2 AND district = $3)',
          [villageData.gid, villageData.name, villageData.district]
        );

        if (existingVillage.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert village with geometry (using simplified schema without PostGIS)
        const insertQuery = `
          INSERT INTO villages (gid, name, state, district, block, properties, boundary_geojson)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name
        `;

        const result = await dbManager.query(insertQuery, [
          villageData.gid,
          villageData.name,
          villageData.state,
          villageData.district,
          villageData.block,
          JSON.stringify(villageData.properties),
          JSON.stringify(geometry)
        ]);

        imported++;
        
        if (imported % 50 === 0) {
          console.log(`   📍 Imported ${imported} villages...`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Error importing village: ${error.message}`);
        
        if (errors > 10) {
          console.error('Too many errors, stopping import');
          break;
        }
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported} villages`);
    console.log(`   ⏭️  Skipped: ${skipped} villages (already exist)`);
    console.log(`   ❌ Errors: ${errors} villages`);

    // Verify import
    const totalVillages = await dbManager.query('SELECT COUNT(*) as count FROM villages');
    console.log(`   📈 Total villages in database: ${totalVillages.rows[0].count}`);

    await dbManager.close();
    console.log('\n🎉 Village import completed!');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    await dbManager.close();
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  importVillages();
}

module.exports = importVillages;