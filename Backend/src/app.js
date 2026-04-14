// app.js //
// express app (idk)

import express from 'express';
import userAuthRoutes from './userAuth/userAuthRoutes.js';

const app = express();
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Form data input

// Mount userAuth routes
app.use('/auth', userAuthRoutes);

export default app;