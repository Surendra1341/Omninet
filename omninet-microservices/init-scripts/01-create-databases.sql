-- Create microservice databases if they do not exist
SELECT 'CREATE DATABASE omninet_auth' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'omninet_auth')\gexec
SELECT 'CREATE DATABASE omninet_storage' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'omninet_storage')\gexec
SELECT 'CREATE DATABASE omninet_notes' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'omninet_notes')\gexec
SELECT 'CREATE DATABASE omninet_ai' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'omninet_ai')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE omninet_auth TO postgres;
GRANT ALL PRIVILEGES ON DATABASE omninet_storage TO postgres;
GRANT ALL PRIVILEGES ON DATABASE omninet_notes TO postgres;
GRANT ALL PRIVILEGES ON DATABASE omninet_ai TO postgres;
