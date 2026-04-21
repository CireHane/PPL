/**
 * Scan Logic Module
 * Barcode scanning: format detection → validation → logging → inventory
 */

import pool from '../config/db.js';
import { detectBarcodeType, normalizeBarcode } from './formatDetection.js';
import { validateSequence, getExpectedBarcodeType } from './sequenceValidator.js';

/**
 * Process a barcode scan for inbound operation
 * @param {string} sessionId - UUID of scan session
 * @param {string} barcodeValue - Raw barcode scanned
 * @param {number} userId - User ID from JWT token
 * @returns {Promise<{ success, message?, data?, error? }>}
 */
export const processScan = async (sessionId, barcodeValue, userId) => {
  try {
    // Step 1: Get current session
    const sessionQuery = 'SELECT * FROM scan_sessions WHERE session_id = $1';
    const sessionResult = await pool.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    const session = sessionResult.rows[0];

    // Reject if session already completed
    if (session.status === 'completed') {
      return {
        success: false,
        error: 'This inbound session is already completed',
      };
    }

    // Step 2: Normalize and detect barcode type
    const normalizedBarcode = normalizeBarcode(barcodeValue);
    const detectedType = detectBarcodeType(normalizedBarcode);

    if (!detectedType) {
      // Log rejection
      await logScan(
        sessionId,
        userId,
        normalizedBarcode,
        null,
        getExpectedBarcodeType(session.current_step),
        session.current_step,
        'rejected',
        'Unrecognized barcode format'
      );

      return {
        success: false,
        error: 'Unrecognized barcode format. Scan a SKU or RAK location.',
      };
    }

    // Step 3: Validate sequence
    const sequenceValidation = validateSequence(session.current_step, detectedType);

    if (!sequenceValidation.valid) {
      // Log rejection
      await logScan(
        sessionId,
        userId,
        normalizedBarcode,
        detectedType,
        getExpectedBarcodeType(session.current_step),
        session.current_step,
        'rejected',
        sequenceValidation.error
      );

      return {
        success: false,
        error: sequenceValidation.error,
      };
    }

    // Step 4: Valid scan - log it
    await logScan(
      sessionId,
      userId,
      normalizedBarcode,
      detectedType,
      getExpectedBarcodeType(session.current_step),
      session.current_step,
      'success',
      null
    );

    // Step 5: Update session state
    const newStepData = {
      ...session.step_data,
      [detectedType]: normalizedBarcode,
    };

    const updateStatusValue = sequenceValidation.isComplete ? 'completed' : 'active';
    const completedAtValue = sequenceValidation.isComplete ? new Date() : null;

    const updateQuery = `
      UPDATE scan_sessions 
      SET current_step = $1, step_data = $2, status = $3, completed_at = $4
      WHERE session_id = $5
    `;

    await pool.query(updateQuery, [
      sequenceValidation.nextStep,
      JSON.stringify(newStepData),
      updateStatusValue,
      completedAtValue,
      sessionId,
    ]);

    // Step 6: If complete, update inventory
    if (sequenceValidation.isComplete) {
      await updateInventory(sessionId, userId, newStepData);
    }

    return {
      success: true,
      message: sequenceValidation.isComplete ? 'Inbound completed!' : 'Scan recorded',
      data: {
        nextStep: sequenceValidation.nextStep,
        isComplete: sequenceValidation.isComplete,
        nextExpected: sequenceValidation.isComplete ? null : 'rak',
        scannedData: newStepData,
      },
    };
  } catch (error) {
    console.error('Error in processScan:', error);
    return {
      success: false,
      error: 'Server error processing scan',
    };
  }
};

/**
 * Log a scan event (success or rejection)
 */
const logScan = async (
  sessionId,
  userId,
  barcodeValue,
  scannedType,
  expectedType,
  sequencePosition,
  status,
  rejectionReason
) => {
  try {
    const logQuery = `
      INSERT INTO scan_logs 
      (session_id, user_id, barcode_value, barcode_type, expected_type, sequence_position, status, rejection_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(logQuery, [
      sessionId,
      userId,
      barcodeValue,
      scannedType,
      expectedType,
      sequencePosition,
      status,
      rejectionReason,
    ]);
  } catch (error) {
    console.error('Error logging scan:', error);
  }
};

/**
 * Update inventory when inbound is completed
 */
const updateInventory = async (sessionId, userId, stepData) => {
  try {
    const { sku, rak } = stepData;

    // Get or create product
    let productId;
    const productQuery = 'SELECT id FROM products WHERE sku = $1';
    let productResult = await pool.query(productQuery, [sku]);

    if (productResult.rows.length === 0) {
      const createQuery = 'INSERT INTO products (sku, name, quantity) VALUES ($1, $2, $3) RETURNING id';
      productResult = await pool.query(createQuery, [sku, `Product ${sku}`, 0]);
    }

    productId = productResult.rows[0].id;

    // Get or create RAK location
    let rakId;
    const rakQuery = 'SELECT id FROM rak_locations WHERE rak_code = $1';
    let rakResult = await pool.query(rakQuery, [rak]);

    if (rakResult.rows.length === 0) {
      const createRakQuery = 'INSERT INTO rak_locations (rak_code, section, capacity) VALUES ($1, $2, $3) RETURNING id';
      const section = rak.charAt(0);
      rakResult = await pool.query(createRakQuery, [rak, section, 100]);
    }

    rakId = rakResult.rows[0].id;

    // Update product quantity
    await pool.query('UPDATE products SET quantity = quantity + 1 WHERE id = $1', [productId]);

    // Update rak current items
    await pool.query('UPDATE rak_locations SET current_items = current_items + 1 WHERE id = $1', [rakId]);

    // Log inventory movement
    const movementQuery = `
      INSERT INTO inventory_movements 
      (product_id, rak_id, movement_type, quantity, scan_session_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(movementQuery, [productId, rakId, 'inbound', 1, sessionId, userId]);
  } catch (error) {
    console.error('Error updating inventory:', error);
  }
};




//== Outbound Logic below (not implemented yet) ==// 