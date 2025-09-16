-- Create database and user if they don't exist
SELECT 'CREATE DATABASE prg_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'prg_db')\gexec

-- Connect to the database
\c prg_db

-- Create user if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prg_user') THEN
      CREATE USER prg_user WITH PASSWORD 'prg_password';
   END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE prg_db TO prg_user;
ALTER DATABASE prg_db OWNER TO prg_user;
