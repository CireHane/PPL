-- ═════════════════════════════════════════════════════════════════
-- CREATE USER TABLE
-- ═════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  session_duration INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS session_duration INTEGER NOT NULL DEFAULT 8;

-- ═════════════════════════════════════════════════════════════════
-- CREATE SESSIONS TABLE
-- ═════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Insert test users (for development)
-- Testuser: test123
INSERT INTO users (username, email, password, session_duration) VALUES
('testuser', 'test@example.com', 'test123', 8)
ON CONFLICT DO NOTHING;

-- Admin: admin123
INSERT INTO users (username, email, password, session_duration) VALUES
('admin', 'admin@example.com', 'admin123', 720)
ON CONFLICT DO NOTHING;

UPDATE users SET session_duration = 8 WHERE username = 'testuser';
UPDATE users SET session_duration = 720 WHERE username = 'admin';




-- ═════════════════════════════════════════════════════════════════
-- BARCODE SCANNING SYSTEM TABLES (Inbound)
-- ═════════════════════════════════════════════════════════════════
-- Scan Sessions (tracks state of ongoing scan sequence)
CREATE TABLE IF NOT EXISTS scan_sessions (
  id SERIAL PRIMARY KEY,
  session_id UUID UNIQUE NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  scan_type VARCHAR(20) DEFAULT 'inbound',
  current_step INT DEFAULT 0,
  step_data JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);


-- Create indexes for barcode system
CREATE INDEX IF NOT EXISTS idx_scan_sessions_id ON scan_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user ON scan_sessions(user_id);


-- ══════════════════════════════════════════════════════════════════════
-- MIGRATION TABLES FROM FIRESTORE (Products, Stock, Requests, Audit)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    parent_sku VARCHAR(20) UNIQUE DEFAULT NULL,
    sku VARCHAR(25) UNIQUE DEFAULT NULL,
    size CHAR(4) DEFAULT NULL,
    disabled BOOLEAN DEFAULT FALSE,
    disabled_timestamp TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS stocks (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    rak CHAR(8) NOT NULL,
    quantity INT CHECK (quantity >= 0) NOT NULL
);

CREATE TABLE IF NOT EXISTS requests(
    id SERIAL PRIMARY KEY,
    stock_id INT REFERENCES stocks(id),
    requested_by INT REFERENCES users(id),
    accepted_by INT  REFERENCES users(id),
    type SMALLINT CHECK (type > 0) NOT NULL,
    quantity_change INT NOT NULL,
    rak_change CHAR(8) DEFAULT NULL,
    request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acceptance_status INT DEFAULT 0,
    accepted_at TIMESTAMP DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS audit_trail(
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(25) NOT NULL,
    rak CHAR(8) NOT NULL,
    starting_quantity INT CHECK (starting_quantity >= 0) NOT NULL,
    quantity_change INT NOT NULL,
    ending_quantity INT CHECK (ending_quantity >=0) NOT NULL,
    type SMALLINT CHECK (type > 0) NOT NULL,
    surat_jalan VARCHAR(30) DEFAULT NULL,
    resi VARCHAR(30) DEFAULT NULL,
    invoice VARCHAR(30) DEFAULT NULL,
    channel VARCHAR(20) DEFAULT NULL,
    description VARCHAR(80) DEFAULT 'tidak ada deskripsi',
    username VARCHAR(50) NOT NULL,
    loged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
