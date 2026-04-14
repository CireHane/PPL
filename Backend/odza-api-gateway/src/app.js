import express from 'express';
import cors from 'cors';
import userAuthRoutes from './userAuth/routes.js';

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

export default app;
