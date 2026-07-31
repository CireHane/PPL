import express from 'express';
import { addProductsHandler, createRequestHandler, getAuditTrailHandler, getProductsHandler, getRequestHandler, getStocksHandler, inboundHandler, outboundHandler, resolveRequestHandler, returRejectHandler } from './handlers.js';

const router = express.Router();

router.post('/addProducts', addProductsHandler);
router.post('/getProducts', getProductsHandler);
router.post('/getStocks', getStocksHandler);
router.post('/getAuditTrail', getAuditTrailHandler);
router.post('/addInbound', inboundHandler);
router.post('/addOutbound', outboundHandler);
router.post('/addReturReject', returRejectHandler);
router.post('/getRequest', getRequestHandler);
router.post('/createRequest', createRequestHandler);
router.post('/resolveRequest', resolveRequestHandler);

export default router;
