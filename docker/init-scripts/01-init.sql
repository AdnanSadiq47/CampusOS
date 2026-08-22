-- Initialize Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Least-Privilege Application User if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'campus_app_user') THEN

      CREATE ROLE campus_app_user LOGIN PASSWORD 'campus_secure_password';
   END IF;
END
$do$;

-- Grant privileges to application user on database
GRANT ALL PRIVILEGES ON DATABASE campus_os_db TO campus_app_user;
GRANT ALL ON SCHEMA public TO campus_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO campus_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO campus_app_user;
