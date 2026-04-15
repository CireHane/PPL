import express from 'express';
import { inboundHandler, inboundAddHandler, outboundHandler, outboundAddHandler } from './handler.js';

const router = express.Router();

router.post('/inbound', inboundHandler);
router.post('/inbound-add', inboundAddHandler);
router.post('/outbound', outboundHandler);
router.post('/outbound-add', outboundAddHandler);

export default router;
