import pool from '../config/db.js';

/**
 * Login user by email or username
 * @param {string} identifier - Email or username
 * @param {string} password - Plain text password
 * @returns {Promise<{success: boolean, user?: {id, username, email}, error?: string}>}
 */
export const loginUser = async (identifier, password) => {
  try {
    // Query user by email OR username
    const query = 'SELECT id, username, email, password FROM users WHERE email = $1 OR username = $1';
    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const user = result.rows[0];

    // Compare password (plain text for now)
    const isValidPassword = password === user.password;

    if (!isValidPassword) {
      return { success: false, error: 'Invalid password' };
    }

    // Return user data (without password)
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error('Error in loginUser:', error);
    return { success: false, error: 'Database error' };
  }
};

/**
 * Create session in database
 * @param {number} userId - User ID
 * @param {string} token - JWT token
 * @param {Date} expiresAt - Session expiry time
 * @returns {Promise<{id: number} | null>}
 */
export const createSession = async (userId, token, expiresAt) => {
  try {
    const query = 'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id';
    const result = await pool.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createSession:', error);
    return null;
  }
};

/**
 * Verify token exists and is not expired
 * @param {string} token - JWT token
 * @returns {Promise<{valid: boolean, user_id?: number, error?: string}>}
 */
export const verifyTokenInDB = async (token) => {
  try {
    const query = 'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()';
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return { valid: false, error: 'Token expired or invalid' };
    }

    return { valid: true, user_id: result.rows[0].user_id };
  } catch (error) {
    console.error('Error in verifyTokenInDB:', error);
    return { valid: false, error: 'Database error' };
  }
};

/**
 * Delete session (logout)
 * @param {string} token - JWT token
 * @returns {Promise<{success: boolean}>}
 */
export const deleteSession = async (token) => {
  try {
    const query = 'DELETE FROM sessions WHERE token = $1';
    const result = await pool.query(query, [token]);
    if(result.rowCount === 0){
      return { success: false};  
    }
    return { success: true};
  } catch (error) {
    console.error('Error in deleteSession:', error);
    return { success: false };
  }
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<{id, username, email} | null>}
 */
export const getUserById = async (userId) => {
  try {
    const query = 'SELECT id, username, email FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};
