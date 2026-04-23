/**
 * Scan Handler Module
 * HTTP handlers for barcode scanning endpoints
 */

import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { processScan, processOutboundScan } from './scanLogic.js';
import { getExpectedBarcodeType, getStepDescription, getExpectedOutboundType, getOutboundStepDescription } from './sequenceValidator.js';

/**
 * Extract user from JWT token
 */
const extractUserFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * GET /scan/session/new
 * Create new inbound scanning session
 */
export const createNewSession = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Generate UUID v4
    const { v4: uuidv4 } = await import('uuid');
    const sessionId = uuidv4();

    // Create session in DB
    const query = `
      INSERT INTO scan_sessions (session_id, user_id, scan_type, current_step, step_data, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING session_id, current_step
    `;

    const result = await pool.query(query, [
      sessionId,
      user.id,
      'inbound',
      0,
      JSON.stringify({}),
      'active',
    ]);

    const session = result.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        sessionId: session.session_id,
        expectedFirst: 'SKU',
        description: getStepDescription(session.current_step),
      },
    });
  } catch (error) {
    console.error('Error in createNewSession:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * POST /scan/inbound
 * Submit barcode scan for inbound process
 */
export const submitInboundScan = async (req, res) => {
  try {
    const { sessionId, barcode } = req.body;

    if (!sessionId || !barcode) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId or barcode',
      });
    }

    // Extract user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Process the scan
    const scanResult = await processScan(sessionId, barcode, user.id);

    if (!scanResult.success) {
      return res.status(400).json({
        success: false,
        error: scanResult.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: scanResult.message,
      data: scanResult.data,
    });
  } catch (error) {
    console.error('Error in submitInboundScan:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * GET /scan/session/:sessionId
 * Get current scan session state
 */
export const getSessionState = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Missing sessionId' });
    }

    // Extract user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Get session from DB
    const query = 'SELECT * FROM scan_sessions WHERE session_id = $1 AND user_id = $2';
    const result = await pool.query(query, [sessionId, user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = result.rows[0];

    // Get scan logs for this session
    const logsQuery = 'SELECT barcode_value, barcode_type, status, rejection_reason FROM scan_logs WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10';
    const logsResult = await pool.query(logsQuery, [sessionId]);

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session.session_id,
        status: session.status,
        currentStep: session.current_step,
        stepDescription: getStepDescription(session.current_step),
        nextExpected: getExpectedBarcodeType(session.current_step),
        scannedData: session.step_data,
        recentScans: logsResult.rows,
      },
    });
  } catch (error) {
    console.error('Error in getSessionState:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

//== Outbound Handling ==//

/**
 * POST /scan/outbound
 * Submit barcode scan for outbound process
 */
export const submitOutboundScan = async (req, res) => {
  try {
    const { sessionId, barcode } = req.body;

    if (!sessionId || !barcode) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId or barcode',
      });
    }

    // Extract user from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = extractUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Process the outbound scan
    const scanResult = await processOutboundScan(sessionId, barcode, user.id);

    if (!scanResult.success) {
      return res.status(400).json({
        success: false,
        error: scanResult.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: scanResult.message,
      data: scanResult.data,
    });
  } catch (error) {
    console.error('Error in submitOutboundScan:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};