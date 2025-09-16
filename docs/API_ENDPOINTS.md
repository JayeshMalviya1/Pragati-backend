# PRAGATI API Endpoints Documentation

## 🌐 Base URL
```
http://localhost:4000/api
```

## 📊 System Endpoints

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-16T07:20:08.499Z",
  "tables": {
    "villages": 45642,
    "claimants": 100,
    "micro_assets": 150,
    "documents": 75,
    "users": 10
  }
}
```

### Database Statistics
```http
GET /api/stats
```
**Response:**
```json
{
  "database": "pragati_db",
  "user": "prg_user",
  "tables": {
    "villages": 45642,
    "claimants": 100,
    "micro_assets": 150,
    "documents": 75,
    "users": 10
  },
  "timestamp": "2025-09-16T07:20:08.499Z"
}
```

## 🏘️ Villages Endpoints

### Get Villages by Bounding Box
```http
GET /api/villages?bbox=minLon,minLat,maxLon,maxLat&limit=50
```

**Parameters:**
- `bbox` (required): Bounding box coordinates `minLon,minLat,maxLon,maxLat`
- `limit` (optional): Maximum number of results (default: 1000)

**Example:**
```
GET /api/villages?bbox=77,20,78,21&limit=10
```

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 1,
        "gid": "OR_0001",
        "name": "Bhubaneswar 1",
        "state": "Odisha",
        "district": "Khordha",
        "block": "Khordha Block 1",
        "centroid_lat": 20.2961,
        "centroid_lon": 85.8245,
        "created_at": "2025-09-16T07:20:08.499Z"
      },
      "geometry": {...}
    }
  ],
  "count": 10,
  "bbox": [77, 20, 78, 21]
}
```

### Search Villages
```http
GET /api/villages/search?q=searchTerm&limit=20
```

**Parameters:**
- `q` (required): Search term (searches name, district, block)
- `limit` (optional): Maximum results (default: 20)

**Example:**
```
GET /api/villages/search?q=Bhubaneswar&limit=5
```

**Response:**
```json
{
  "query": "Bhubaneswar",
  "count": 5,
  "villages": [
    {
      "id": 1,
      "gid": "OR_0001",
      "name": "Bhubaneswar 1",
      "state": "Odisha",
      "district": "Khordha",
      "block": "Khordha Block 1",
      "centroid_lat": 20.2961,
      "centroid_lon": 85.8245
    }
  ]
}
```

## 👥 Claimants Endpoints

### Get Claimants
```http
GET /api/claimants?village_id=1&claimant_type=IFR&status=pending&limit=50
```

**Parameters:**
- `village_id` (optional): Filter by village ID
- `claimant_type` (optional): Filter by type (`IFR` or `CR`)
- `status` (optional): Filter by status (`pending`, `recognized`, `rejected`)
- `limit` (optional): Maximum results (default: 50)

**Example:**
```
GET /api/claimants?claimant_type=IFR&limit=10
```

**Response:**
```json
{
  "claimants": [
    {
      "id": 1,
      "claimant_uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Kondh Community 1",
      "claimant_type": "IFR",
      "tribal_group": "Kondh",
      "village_id": 1,
      "village_name": "Bhubaneswar 1",
      "district": "Khordha",
      "area_ha": 5.25,
      "status": "pending",
      "properties": {...},
      "created_at": "2025-09-16T07:20:08.499Z"
    }
  ],
  "count": 10,
  "filters": {
    "claimant_type": "IFR"
  }
}
```

### Create New Claim
```http
POST /api/claims
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Santhal Community Claim",
  "claimant_type": "CR",
  "tribal_group": "Santhal",
  "village_name": "Bhubaneswar 1",
  "area_ha": 10.5,
  "geometry": {
    "type": "Polygon",
    "coordinates": [...]
  },
  "properties": {
    "family_members": 8,
    "occupation": "farming"
  }
}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "id": 101,
    "claimant_uuid": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Santhal Community Claim",
    "claimant_type": "CR",
    "tribal_group": "Santhal",
    "village_id": 1,
    "area_ha": 10.5,
    "status": "pending",
    "created_at": "2025-09-16T07:20:08.499Z"
  },
  "village_found": true
}
```

## 🌿 Micro Assets Endpoints

### Get Micro Assets
```http
GET /api/assets?village_id=1&asset_type=water_body&district=Khordha&limit=50
```

**Parameters:**
- `village_id` (optional): Filter by village ID
- `asset_type` (optional): Filter by type (`water_body`, `vegetation`, `farmland`, `infrastructure`)
- `district` (optional): Filter by district name
- `limit` (optional): Maximum results (default: 50)

**Example:**
```
GET /api/assets?asset_type=water_body&limit=10
```

**Response:**
```json
{
  "assets": [
    {
      "id": 1,
      "asset_uuid": "123e4567-e89b-12d3-a456-426614174002",
      "name": "water body 1",
      "asset_type": "water_body",
      "village_id": 1,
      "village_name": "Bhubaneswar 1",
      "district": "Khordha",
      "area_ha": 2.5,
      "status": "active",
      "properties": {...},
      "created_at": "2025-09-16T07:20:08.499Z"
    }
  ],
  "count": 10,
  "filters": {
    "asset_type": "water_body"
  }
}
```

## 📄 Documents Endpoints

### Get Documents
```http
GET /api/documents?claimant_id=1&limit=20
```

**Parameters:**
- `claimant_id` (optional): Filter by claimant ID
- `limit` (optional): Maximum results (default: 20)

**Example:**
```
GET /api/documents?limit=5
```

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "doc_uuid": "123e4567-e89b-12d3-a456-426614174003",
      "claimant_id": 1,
      "claimant_name": "Kondh Community 1",
      "filename": "claim_document_1.pdf",
      "file_path": "/uploads/documents/claim_document_1.pdf",
      "raw_text": "This is a forest rights claim document...",
      "structured": {...},
      "ocr_confidence": 0.95,
      "uploaded_by": "user_1",
      "uploaded_at": "2025-09-16T07:20:08.499Z"
    }
  ],
  "count": 5,
  "filters": {}
}
```

## 🧪 Mock Data Commands

### Generate All Mock Data
```bash
npm run generate-mock
```

### Generate Specific Data Types
```bash
# Generate 25 villages
node scripts/generate-mock-data.js villages 25

# Generate 50 claimants
node scripts/generate-mock-data.js claimants 50

# Generate 75 micro assets
node scripts/generate-mock-data.js assets 75

# Generate 30 documents
node scripts/generate-mock-data.js documents 30

# Generate 5 users
node scripts/generate-mock-data.js users 5
```

## 🔍 Example API Calls

### Test with Browser
Copy these URLs directly into your browser:

1. **Health Check:**
   ```
   http://localhost:4000/api/health
   ```

2. **Get 5 villages:**
   ```
   http://localhost:4000/api/villages?bbox=77,17,87,22&limit=5
   ```

3. **Search for Bhubaneswar:**
   ```
   http://localhost:4000/api/villages/search?q=Bhubaneswar&limit=3
   ```

4. **Get IFR claimants:**
   ```
   http://localhost:4000/api/claimants?claimant_type=IFR&limit=5
   ```

5. **Get water bodies:**
   ```
   http://localhost:4000/api/assets?asset_type=water_body&limit=5
   ```

6. **Get recent documents:**
   ```
   http://localhost:4000/api/documents?limit=3
   ```

### Test with curl
```bash
# Health check
curl http://localhost:4000/api/health

# Get villages
curl "http://localhost:4000/api/villages?bbox=77,17,87,22&limit=5"

# Create a new claim
curl -X POST http://localhost:4000/api/claims \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Community Claim",
    "claimant_type": "IFR",
    "tribal_group": "Kondh",
    "village_name": "Bhubaneswar 1",
    "area_ha": 5.0
  }'
```

## 📊 Response Codes

- `200` - Success
- `400` - Bad Request (missing required parameters)
- `404` - Not Found
- `500` - Server Error

## 🔐 Authentication

Currently, the API is open for development. In production, you should add:
- JWT authentication
- Rate limiting
- Input validation
- CORS configuration