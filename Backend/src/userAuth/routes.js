import express from 'express';
import { loginHandler, logoutHandler, verifyHandler } from './handlers.js';

const router = express.Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.post('/verify', verifyHandler);

export default router;
