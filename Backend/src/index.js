import 'dotenv/config';

import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`✅ ODZA API Gateway running on port ${PORT}`);
      console.log(`📍 Service: odza-api-gateway`);
      console.log(`🔐 Authentication endpoints:`);
      console.log(`   - POST /auth/login`);
      console.log(`   - POST /auth/logout`);
      console.log(`   - POST /auth/verify`);
      console.log(`📦 Barcode Scanning endpoints:`);
      console.log(`   - POST /scan/session/new`);
      console.log(`   - POST /scan/session/inbound`);
      console.log(`   - POST /scan/session/outbound`);
      console.log(`   - GET /scan/session/:sessionId`);
      console.log(`💾 Firebase/Inventory endpoints:`);
      console.log(`   - POST /firebase/stock`);
      console.log(`   - POST /firebase/stock-add`);
      console.log(`   - POST /firebase/inbound-adds`);
      console.log(`   - POST /firebase/outbound-adds`);
      console.log(`   - POST /firebase/retur-adds`);
      console.log(`   - POST /firebase/logs`);
      console.log(`   - POST /firebase/logPreview`);
      
      console.log(`💚 Health check: GET /health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
