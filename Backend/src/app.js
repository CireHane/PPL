// app.js //
// express app (idk)

import express from 'express';

const app = express();
app.use(express.urlencoded({ extended: true }));

export default app;