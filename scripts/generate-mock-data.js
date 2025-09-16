#!/usr/bin/env node

/**
 * Mock Data Generator for PRAGATI Project
 * 
 * This script generates realistic mock data for testing:
 * - Villages (if not already imported)
 * - Claimants (forest rights claims)
 * - Micro Assets (water bodies, vegetation, farmland)
 * - Documents (OCR processed documents)
 * - Users (system users)
 */

require('dotenv').config();
const dbManager = require('../src/config/database');

// Mock data generators
const mockData = {
  // Odisha districts for realistic data
  districts: [
    'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh',
    'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur',
    'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar',
    'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh',
    'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'
  ],

  // Tribal groups in Odisha
  tribalGroups: [
    'Kondh', 'Santhal', 'Kolha', 'Munda', 'Oraon', 'Gond', 'Bhuiya', 'Juang',
    'Ho', 'Binjhal', 'Kisan', 'Paroja', 'Gadaba', 'Savar', 'Lodha', 'Mahali'
  ],

  // Common village name patterns
  villageNames: [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri',
    'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Barbil',
    'Rayagada', 'Kendujhar', 'Sunabeda', 'Talcher', 'Anugul', 'Dhenkanal'
  ],

  // Asset types
  assetTypes: ['water_body', 'vegetation', 'farmland', 'infrastructure'],

  // Claimant types
  claimantTypes: ['IFR', 'CR'],

  // User roles
  userRoles: ['admin', 'user', 'viewer']
};

class MockDataGenerator {
  constructor() {
    this.villageIds = [];
    this.claimantIds = [];
  }

  // Generate random number between min and max
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate random decimal between min and max
  randomDecimal(min, max, decimals = 4) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  // Pick random item from array
  randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Generate random coordinates for Odisha
  generateOdishaCoordinates() {
    return {
      lat: this.randomDecimal(17.78, 22.57, 6), // Odisha latitude range
      lon: this.randomDecimal(81.37, 87.53, 6)  // Odisha longitude range
    };
  }

  // Generate mock villages
  async generateVillages(count = 50) {
    console.log(`📍 Generating ${count} mock villages...`);
    
    const villages = [];
    for (let i = 0; i < count; i++) {
      const coords = this.generateOdishaCoordinates();
      const district = this.randomPick(mockData.districts);
      
      const village = {
        gid: `OR_${String(i + 1).padStart(4, '0')}`,
        name: `${this.randomPick(mockData.villageNames)} ${i + 1}`,
        state: 'Odisha',
        district: district,
        block: `${district} Block ${this.randomBetween(1, 5)}`,
        properties: JSON.stringify({
          population: this.randomBetween(500, 5000),
          area_sq_km: this.randomDecimal(1, 50, 2),
          literacy_rate: this.randomDecimal(60, 95, 1)
        }),
        centroid_lat: coords.lat,
        centroid_lon: coords.lon,
        boundary_geojson: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [coords.lon - 0.01, coords.lat - 0.01],
            [coords.lon + 0.01, coords.lat - 0.01],
            [coords.lon + 0.01, coords.lat + 0.01],
            [coords.lon - 0.01, coords.lat + 0.01],
            [coords.lon - 0.01, coords.lat - 0.01]
          ]]
        })
      };
      
      villages.push(village);
    }

    // Insert villages
    for (const village of villages) {
      try {
        const result = await dbManager.query(`
          INSERT INTO villages (gid, name, state, district, block, properties, centroid_lat, centroid_lon, boundary_geojson)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          village.gid, village.name, village.state, village.district, 
          village.block, village.properties, village.centroid_lat, 
          village.centroid_lon, village.boundary_geojson
        ]);
        
        this.villageIds.push(result.rows[0].id);
      } catch (error) {
        console.error(`Error inserting village ${village.name}:`, error.message);
      }
    }

    console.log(`✅ Generated ${this.villageIds.length} villages`);
  }

  // Generate mock claimants
  async generateClaimants(count = 100) {
    console.log(`👥 Generating ${count} mock claimants...`);
    
    if (this.villageIds.length === 0) {
      // Get existing village IDs
      const result = await dbManager.query('SELECT id FROM villages LIMIT 100');
      this.villageIds = result.rows.map(row => row.id);
    }

    const claimants = [];
    for (let i = 0; i < count; i++) {
      const claimantType = this.randomPick(mockData.claimantTypes);
      const tribalGroup = this.randomPick(mockData.tribalGroups);
      const villageId = this.randomPick(this.villageIds);
      
      const claimant = {
        name: `${tribalGroup} Community ${i + 1}`,
        claimant_type: claimantType,
        tribal_group: tribalGroup,
        village_id: villageId,
        area_ha: this.randomDecimal(0.5, 25.0, 2),
        status: this.randomPick(['pending', 'recognized', 'rejected']),
        properties: JSON.stringify({
          family_members: this.randomBetween(3, 12),
          occupation: this.randomPick(['farming', 'forest_collection', 'livestock', 'mixed']),
          claim_date: new Date(Date.now() - this.randomBetween(0, 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        })
      };

      claimants.push(claimant);
    }

    // Insert claimants
    for (const claimant of claimants) {
      try {
        const result = await dbManager.query(`
          INSERT INTO claimants (name, claimant_type, tribal_group, village_id, area_ha, status, properties)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          claimant.name, claimant.claimant_type, claimant.tribal_group,
          claimant.village_id, claimant.area_ha, claimant.status, claimant.properties
        ]);
        
        this.claimantIds.push(result.rows[0].id);
      } catch (error) {
        console.error(`Error inserting claimant ${claimant.name}:`, error.message);
      }
    }

    console.log(`✅ Generated ${this.claimantIds.length} claimants`);
  }

  // Generate mock micro assets
  async generateMicroAssets(count = 150) {
    console.log(`🌿 Generating ${count} mock micro assets...`);
    
    if (this.villageIds.length === 0) {
      const result = await dbManager.query('SELECT id FROM villages LIMIT 100');
      this.villageIds = result.rows.map(row => row.id);
    }

    const assets = [];
    for (let i = 0; i < count; i++) {
      const assetType = this.randomPick(mockData.assetTypes);
      const villageId = this.randomPick(this.villageIds);
      
      const asset = {
        name: `${assetType.replace('_', ' ')} ${i + 1}`,
        asset_type: assetType,
        village_id: villageId,
        district: this.randomPick(mockData.districts),
        area_ha: this.randomDecimal(0.1, 10.0, 2),
        status: this.randomPick(['active', 'degraded', 'restored']),
        properties: JSON.stringify({
          condition: this.randomPick(['excellent', 'good', 'fair', 'poor']),
          accessibility: this.randomPick(['easy', 'moderate', 'difficult']),
          usage: this.randomPick(['community', 'individual', 'restricted'])
        })
      };

      assets.push(asset);
    }

    // Insert micro assets
    let insertedCount = 0;
    for (const asset of assets) {
      try {
        await dbManager.query(`
          INSERT INTO micro_assets (name, asset_type, village_id, district, area_ha, status, properties)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          asset.name, asset.asset_type, asset.village_id,
          asset.district, asset.area_ha, asset.status, asset.properties
        ]);
        
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting asset ${asset.name}:`, error.message);
      }
    }

    console.log(`✅ Generated ${insertedCount} micro assets`);
  }

  // Generate mock documents
  async generateDocuments(count = 75) {
    console.log(`📄 Generating ${count} mock documents...`);
    
    if (this.claimantIds.length === 0) {
      const result = await dbManager.query('SELECT id FROM claimants LIMIT 50');
      this.claimantIds = result.rows.map(row => row.id);
    }

    const documents = [];
    for (let i = 0; i < count; i++) {
      const claimantId = this.randomPick(this.claimantIds);
      
      const document = {
        claimant_id: claimantId,
        filename: `claim_document_${i + 1}.pdf`,
        file_path: `/uploads/documents/claim_document_${i + 1}.pdf`,
        raw_text: `This is a forest rights claim document for claimant ID ${claimantId}. The document contains details about land usage, family information, and traditional rights.`,
        structured: JSON.stringify({
          claimant_name: `Claimant ${i + 1}`,
          document_type: this.randomPick(['IFR_Application', 'CR_Application', 'Survey_Report', 'Verification_Document']),
          claim_area: this.randomDecimal(0.5, 25.0, 2),
          submission_date: new Date(Date.now() - this.randomBetween(0, 180 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          status: this.randomPick(['submitted', 'under_review', 'approved', 'rejected'])
        }),
        ocr_confidence: this.randomDecimal(0.75, 0.98, 4),
        uploaded_by: `user_${this.randomBetween(1, 10)}`
      };

      documents.push(document);
    }

    // Insert documents
    let insertedCount = 0;
    for (const document of documents) {
      try {
        await dbManager.query(`
          INSERT INTO documents (claimant_id, filename, file_path, raw_text, structured, ocr_confidence, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          document.claimant_id, document.filename, document.file_path,
          document.raw_text, document.structured, document.ocr_confidence, document.uploaded_by
        ]);
        
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting document ${document.filename}:`, error.message);
      }
    }

    console.log(`✅ Generated ${insertedCount} documents`);
  }

  // Generate mock users
  async generateUsers(count = 10) {
    console.log(`👤 Generating ${count} mock users...`);
    
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = {
        username: `user_${i + 1}`,
        display_name: `User ${i + 1}`,
        email: `user${i + 1}@pragati.gov.in`,
        role: this.randomPick(mockData.userRoles),
        password_hash: 'hashed_password_placeholder', // In real app, use proper hashing
        is_active: this.randomBetween(0, 10) > 1 // 90% active users
      };

      users.push(user);
    }

    // Insert users
    let insertedCount = 0;
    for (const user of users) {
      try {
        await dbManager.query(`
          INSERT INTO users (username, display_name, email, role, password_hash, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.username, user.display_name, user.email,
          user.role, user.password_hash, user.is_active
        ]);
        
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting user ${user.username}:`, error.message);
      }
    }

    console.log(`✅ Generated ${insertedCount} users`);
  }

  // Generate all mock data
  async generateAll() {
    console.log('🎭 Generating comprehensive mock data for PRAGATI...\n');
    
    try {
      await dbManager.testConnection();
      
      // Check if villages already exist
      const villageCount = await dbManager.query('SELECT COUNT(*) as count FROM villages');
      const existingVillages = parseInt(villageCount.rows[0].count);
      
      if (existingVillages === 0) {
        await this.generateVillages(50);
      } else {
        console.log(`📍 Using existing ${existingVillages} villages`);
        const result = await dbManager.query('SELECT id FROM villages LIMIT 100');
        this.villageIds = result.rows.map(row => row.id);
      }
      
      await this.generateClaimants(100);
      await this.generateMicroAssets(150);
      await this.generateDocuments(75);
      await this.generateUsers(10);
      
      // Show final statistics
      console.log('\n📊 Mock Data Generation Complete!');
      const stats = await this.getStats();
      Object.entries(stats).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} records`);
      });
      
      await dbManager.close();
      console.log('\n🎉 All mock data generated successfully!');
      
    } catch (error) {
      console.error('\n❌ Mock data generation failed:', error.message);
      process.exit(1);
    }
  }

  // Get database statistics
  async getStats() {
    const tables = ['villages', 'claimants', 'micro_assets', 'documents', 'users'];
    const stats = {};
    
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
}

// Run the mock data generator
async function generateMockData() {
  const generator = new MockDataGenerator();
  await generator.generateAll();
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const generator = new MockDataGenerator();
  
  if (args.length === 0) {
    generateMockData();
  } else {
    const command = args[0];
    const count = parseInt(args[1]) || undefined;
    
    switch (command) {
      case 'villages':
        generator.generateVillages(count).then(() => dbManager.close());
        break;
      case 'claimants':
        generator.generateClaimants(count).then(() => dbManager.close());
        break;
      case 'assets':
        generator.generateMicroAssets(count).then(() => dbManager.close());
        break;
      case 'documents':
        generator.generateDocuments(count).then(() => dbManager.close());
        break;
      case 'users':
        generator.generateUsers(count).then(() => dbManager.close());
        break;
      default:
        console.log('Usage: node generate-mock-data.js [villages|claimants|assets|documents|users] [count]');
        console.log('Or run without arguments to generate all mock data');
    }
  }
}

module.exports = MockDataGenerator;