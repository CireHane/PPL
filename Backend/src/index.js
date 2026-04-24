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
      console.log(`💚 Health check: GET /health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
