import jwt from 'jsonwebtoken';
import { loginUser, createSession, verifyTokenInDB, deleteSession, getUserById } from './logic.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || '8');

/**
 * Login handler
 * POST /auth/login
 * Body: { email_or_username: string, password: string }
 */
export const loginHandler = async (req, res) => {
  try {
    const { email_or_username, password } = req.body;

    // Validate input
    if (!email_or_username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required',
      });
    }

    // Check user credentials
    const loginResult = await loginUser(email_or_username, password);

    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        error: loginResult.error,
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: loginResult.user.id,
      username: loginResult.user.username,
      email: loginResult.user.email,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: `${SESSION_EXPIRY_HOURS}h` });

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Save session in database
    await createSession(loginResult.user.id, token, expiresAt);

    // Return response
    return res.status(200).json({
      success: true,
      token,
      user: loginResult.user,
      expiresIn: SESSION_EXPIRY_HOURS * 60 * 60, // in seconds
    });
  } catch (error) {
    console.error('Error in loginHandler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Logout handler
 * POST /auth/logout
 * Body: { token: string }
 */
export const logoutHandler = async (req, res) => {
  try {
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Delete session from database
    const result = await deleteSession(token);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to logout',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error in logoutHandler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Verify token handler
 * POST /auth/verify
 * Body: { token: string }
 */
export const verifyHandler = async (req, res) => {
  try {
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required',
      });
    }

    // Verify token in database
    const verifyResult = await verifyTokenInDB(token);

    if (!verifyResult.valid) {
      return res.status(401).json({
        valid: false,
        error: verifyResult.error,
      });
    }

    // Get user data
    const user = await getUserById(verifyResult.user_id);

    if (!user) {
      return res.status(404).json({
        valid: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      valid: true,
      user,
    });
  } catch (error) {
    console.error('Error in verifyHandler:', error);
    return res.status(500).json({
      valid: false,
      error: 'Internal server error',
    });
  }
};
