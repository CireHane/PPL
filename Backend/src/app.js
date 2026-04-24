import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 Current directory:', __dirname);
console.log('🔍 Looking for .env in:', path.resolve(__dirname, '.env'));
console.log('📦 FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

console.log('🔧 ENV TEST:', {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    API_KEY_EXISTS: !!process.env.FIREBASE_API_KEY
});


import express from 'express';
import cors from 'cors';
import userAuthRoutes from './userAuth/routes.js';
import firebaseRouter from './firebase/routes.js';
import scanRoutes from './barcScanSys/scanRoutes.js';
import { initializeFirebaseApp } from './firebase/logic.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'odza-api-gateway' });
});

// Auth routes
app.use('/auth', userAuthRoutes);

// Barcode scanning routes
app.use('/scan', scanRoutes);

initializeFirebaseApp()
app.use('/firebase', firebaseRouter);

export default app;
