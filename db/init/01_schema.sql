-- enable PostGIS and helper extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- for text search if needed
CREATE EXTENSION IF NOT EXISTS btree_gist;-- helpful for indexing multiple columns

-- villages: master boundaries table
CREATE TABLE IF NOT EXISTS villages (
  id SERIAL PRIMARY KEY,
  gid TEXT, -- original id from OC.json if any
  name TEXT,
  state TEXT,
  district TEXT,
  block TEXT,
  properties JSONB,
  boundary GEOMETRY(MULTIPOLYGON, 4326) -- store as multipolygon
);

-- centroid for faster label/point queries
ALTER TABLE villages ADD COLUMN IF NOT EXISTS centroid GEOMETRY(Point,4326);

-- claimants (individual and community)
CREATE TABLE IF NOT EXISTS claimants (
  id SERIAL PRIMARY KEY,
  claimant_uuid UUID DEFAULT gen_random_uuid(),
  name TEXT,
  claimant_type TEXT, -- 'IFR' or 'CR'
  tribal_group TEXT,
  village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
  area_ha NUMERIC,
  status TEXT, -- 'pending'|'recognized'|'rejected'
  geom GEOMETRY(Geometry,4326), -- could be polygon or point, accept any geometry
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- micro-assets (water bodies, vegetation, farmland)
CREATE TABLE IF NOT EXISTS micro_assets (
  id SERIAL PRIMARY KEY,
  asset_uuid UUID DEFAULT gen_random_uuid(),
  name TEXT,
  asset_type TEXT, -- 'water_body','vegetation','farmland'
  village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL,
  district TEXT,
  area_ha NUMERIC,
  status TEXT,
  geom GEOMETRY(Geometry,4326),
  properties JSONB
);

-- documents: store OCR raw + structured JSON and path to file
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  doc_uuid UUID DEFAULT gen_random_uuid(),
  claimant_id INTEGER REFERENCES claimants(id) ON DELETE SET NULL,
  filename TEXT,
  file_path TEXT,
  raw_text TEXT,
  structured JSONB, -- OCR parsed fields
  ocr_confidence NUMERIC,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- users (basic)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_villages_boundary_gist ON villages USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_villages_centroid ON villages USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_claimants_geom_gist ON claimants USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_micro_assets_geom_gist ON micro_assets USING GIST(geom);

-- trigram index for name searches
CREATE INDEX IF NOT EXISTS idx_villages_name_trgm ON villages USING gin (name gin_trgm_ops);

-- trigger to update centroid when boundary inserted/updated
CREATE OR REPLACE FUNCTION update_village_centroid() RETURNS trigger AS $$
BEGIN
  NEW.centroid = ST_Centroid(NEW.boundary);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_village_centroid ON villages;
CREATE TRIGGER trg_update_village_centroid
BEFORE INSERT OR UPDATE ON villages
FOR EACH ROW EXECUTE FUNCTION update_village_centroid();
