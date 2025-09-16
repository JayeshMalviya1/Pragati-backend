# PRAGATI Centralized Database Setup

This document describes the centralized PostgreSQL database setup for the PRAGATI project, including configuration, schema management, and data import procedures.

## 🏗️ Database Architecture

### Database Configuration
- **Database Name**: `pragati_db`
- **Database User**: `prg_user`
- **Host**: `localhost:5432`
- **Extensions**: PostGIS, pg_trgm, btree_gist

### Schema Overview
The database contains the following main tables:

1. **villages** - Village boundary data with PostGIS geometry
2. **claimants** - Individual and community forest rights claims
3. **micro_assets** - Water bodies, vegetation, farmland mapping
4. **documents** - OCR processed documents and metadata
5. **users** - Application user management

## 🚀 Quick Setup

### Prerequisites
- PostgreSQL 12+ with PostGIS extension
- Node.js 16+
- Access to PostgreSQL superuser account

### 1. Environment Configuration
Update your `.env` file:
```env
# Centralized Database Configuration
DATABASE_URL=postgres://prg_user:prg_password@localhost:5432/pragati_db
DB_USER=prg_user
DB_PASSWORD=prg_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pragati_db
```

### 2. Database Setup
Run the automated setup script:
```bash
npm run setup-db
```

This script will:
- Create the `prg_user` database user
- Create the `pragati_db` database
- Set up proper permissions
- Initialize the schema with all tables and indexes
- Enable required PostgreSQL extensions

### 3. Import Village Data
Import village boundaries from OC.json:
```bash
npm run import-villages
```

### 4. Start the Server
```bash
npm start
```

## 📊 Health Monitoring

### Health Check
Check database connectivity and table status:
```bash
curl http://localhost:4000/api/health
```

### Database Statistics
Get record counts for all tables:
```bash
curl http://localhost:4000/api/stats
```

Or use npm scripts:
```bash
npm run db-health
npm run db-stats
```

## 🗄️ Database Schema Details

### Villages Table
Stores village boundary data with PostGIS geometry support:
```sql
CREATE TABLE villages (
  id SERIAL PRIMARY KEY,
  gid TEXT,                                    -- Original GID from source data
  name TEXT NOT NULL,                          -- Village name
  state TEXT,                                  -- State name
  district TEXT,                               -- District name
  block TEXT,                                  -- Block name
  properties JSONB DEFAULT '{}',               -- Additional properties
  boundary GEOMETRY(MULTIPOLYGON, 4326),      -- Village boundary
  centroid GEOMETRY(POINT, 4326),              -- Auto-calculated centroid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Claimants Table
Stores forest rights claims (Individual and Community):
```sql
CREATE TABLE claimants (
  id SERIAL PRIMARY KEY,
  claimant_uuid UUID DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  claimant_type TEXT CHECK (claimant_type IN ('IFR', 'CR')),
  tribal_group TEXT,
  village_id INTEGER REFERENCES villages(id),
  area_ha NUMERIC(10,4),
  status TEXT DEFAULT 'pending',
  geom GEOMETRY(GEOMETRY, 4326),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Micro Assets Table
Stores mapped micro-assets (water bodies, vegetation, etc.):
```sql
CREATE TABLE micro_assets (
  id SERIAL PRIMARY KEY,
  asset_uuid UUID DEFAULT gen_random_uuid(),
  name TEXT,
  asset_type TEXT CHECK (asset_type IN ('water_body', 'vegetation', 'farmland', 'infrastructure')),
  village_id INTEGER REFERENCES villages(id),
  district TEXT,
  area_ha NUMERIC(10,4),
  status TEXT DEFAULT 'active',
  geom GEOMETRY(GEOMETRY, 4326),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Database Management

### Connection Management
The application uses a centralized database manager (`src/config/database.js`) that provides:
- Connection pooling with configurable limits
- Automatic reconnection handling
- Query logging and error handling
- Graceful shutdown procedures

### Schema Management
Schema operations are handled by `src/config/schema.js`:
- Automatic table creation and updates
- Index management for performance
- Trigger setup for data consistency
- Health checks and statistics

### Performance Optimization
The database includes several performance optimizations:
- **Spatial Indexes**: GIST indexes on all geometry columns
- **Text Search**: Trigram indexes for village name searches
- **Foreign Key Indexes**: Indexes on all foreign key columns
- **Automatic Triggers**: Centroid calculation and timestamp updates

## 🔍 API Endpoints

### Village Data
```http
GET /api/villages?bbox=minLon,minLat,maxLon,maxLat&zoom=10
```
Returns village boundaries within the specified bounding box.

### Claims Data
```http
POST /api/claims
Content-Type: application/json

{
  "name": "Claimant Name",
  "claimant_type": "IFR",
  "tribal_group": "Tribal Group",
  "village_name": "Village Name",
  "area_ha": 5.25,
  "geometry": { ... },
  "properties": { ... }
}
```

### Health and Statistics
```http
GET /api/health      # Database health check
GET /api/stats       # Table record counts
```

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure PostgreSQL is running on localhost:5432
   - Check firewall settings
   - Verify database credentials

2. **PostGIS Extension Missing**
   ```sql
   CREATE EXTENSION postgis;
   ```

3. **Permission Denied**
   - Ensure `prg_user` has proper privileges
   - Run setup script as PostgreSQL superuser

4. **Import Errors**
   - Check OC.json file format
   - Verify geometry validity
   - Review error logs for specific issues

### Manual Database Setup
If the automated script fails, you can set up manually:

```sql
-- Connect as postgres superuser
CREATE USER prg_user WITH PASSWORD 'prg_password';
CREATE DATABASE pragati_db OWNER prg_user;
GRANT ALL PRIVILEGES ON DATABASE pragati_db TO prg_user;

-- Connect to pragati_db as prg_user
\c pragati_db prg_user

-- Enable extensions
CREATE EXTENSION postgis;
CREATE EXTENSION pg_trgm;
CREATE EXTENSION btree_gist;

-- Run schema initialization
-- (Tables will be created automatically when server starts)
```

## 📈 Next Steps

1. **PostGIS Advanced Features**: Implement spatial analysis functions
2. **Data Validation**: Add geometry validation and cleanup procedures  
3. **Backup Strategy**: Set up automated database backups
4. **Monitoring**: Implement database performance monitoring
5. **Scaling**: Consider read replicas for high-traffic scenarios

## 🤝 Support

For database-related issues:
1. Check the application logs for detailed error messages
2. Use the health check endpoint to verify connectivity
3. Review this documentation for common solutions
4. Contact the development team for complex issues