-- Create user with password
CREATE USER prg_user WITH PASSWORD 'prg_password';

-- Create database
CREATE DATABASE prg_db OWNER prg_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE prg_db TO prg_user;

-- Connect to the database and grant schema privileges
\c prg_db
GRANT ALL ON SCHEMA public TO prg_user;
