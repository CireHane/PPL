import express from 'express';
import { stockAdd, inboundHandler, inboundAddHandler, outboundHandler, outboundAddHandler, rakAdd } from './handler.js';

const router = express.Router();


router.post('/stock-add', stockAdd);
router.post('/rak-add', rakAdd);
router.post('/inbound', inboundHandler);
router.post('/inbound-add', inboundAddHandler);
router.post('/outbound', outboundHandler);
router.post('/outbound-add', outboundAddHandler);

export default router;
