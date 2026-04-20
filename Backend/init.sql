-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
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
INSERT INTO users (username, email, password) VALUES 
('testuser', 'test@example.com', 'test123')
ON CONFLICT DO NOTHING;

-- Admin: admin123
INSERT INTO users (username, email, password) VALUES 
('admin', 'admin@example.com', 'admin123')
ON CONFLICT DO NOTHING;

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
