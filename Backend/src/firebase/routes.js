import express from 'express';
import { 
    stock, 
    stockAdd, 
    rakAdd, 
    inboundHandler, 
    inboundAddHandler, 
    inboundAddsHandler, 
    outboundHandler, 
    outboundAddHandler, 
    outboundAddsHandler, 
    returAddHandler, 
    returAddsHandler,
    logHandler, 
    logPrevHandler,
} from './handler.js';

const router = express.Router();


router.post('/stock', stock);
router.post('/stock-add', stockAdd);
router.post('/rak-add', rakAdd); // Delete later, Only for testing
router.post('/inbound', inboundHandler);
router.post('/inbound-add', inboundAddHandler);
router.post('/inbound-adds', inboundAddsHandler);
router.post('/outbound', outboundHandler);
router.post('/outbound-add', outboundAddHandler);
router.post('/outbound-adds', outboundAddsHandler);
router.post('/retur-add', returAddHandler)
router.post('/retur-adds', returAddsHandler)
router.post('/logs', logHandler);
router.post('/logPreview', logPrevHandler);

export default router;
