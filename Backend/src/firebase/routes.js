import express from 'express';
import { stockAdd, inboundHandler, inboundAddHandler, inboundAddsHandler, outboundHandler, outboundAddHandler, rakAdd, logHandler, returAddHandler, stock } from './handler.js';

const router = express.Router();


router.post('/stock', stock);
router.post('/stock-add', stockAdd); // Delete later, Only for testing
router.post('/rak-add', rakAdd); // Delete later, Only for testing
router.post('/inbound', inboundHandler);
router.post('/inbound-add', inboundAddHandler);
router.post('/inbound-adds', inboundAddsHandler);
router.post('/outbound', outboundHandler);
router.post('/outbound-add', outboundAddHandler);
router.post('/retur-add', returAddHandler)
router.post('/logs', logHandler);

export default router;
