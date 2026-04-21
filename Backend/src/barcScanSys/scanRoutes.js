//Defines barcode scanning endpoints

import express from 'express';
import { createNewSession, submitInboundScan, getSessionState } from './scanHandler.js';

const router = express.Router();


// POST /scan/session/new
// Create a new inbound scanning session
router.post('/session/new', createNewSession);

/**
 * POST /scan/inbound
 * Submit a barcode scan for inbound process
 * Body: { sessionId, barcode }
 * Header: Authorization: Bearer <token>
 */
router.post('/inbound', submitInboundScan);

/**
 * GET /scan/session/:sessionId
 * Get current state of a scanning session
 * Header: Authorization: Bearer <token>
 */
router.get('/session/:sessionId', getSessionState);

export default router;




//== Outbound Routes below (not implemented yet) ==// 