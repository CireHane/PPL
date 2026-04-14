import express from 'express';
import userAuthRoutes from './userAuth/routes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'odza-api-gateway' });
});

// Auth routes
app.use('/auth', userAuthRoutes);

export default app;
