import express from 'express';
import { addProductsHandler, getAuditTrailHandler, getProductsHandler, getStocksHandler, inboundHandler, outboundHandler, returRejectHandler } from './handlers.js';

const router = express.Router();

router.post('/addProducts', addProductsHandler);
router.post('/getProducts', getProductsHandler);
router.post('/getStocks', getStocksHandler);
router.post('/getAuditTrail', getAuditTrailHandler);
router.post('/addInbound', inboundHandler);
router.post('/addOutbound', outboundHandler);
router.post('/addReturReject', returRejectHandler);

export default router;
