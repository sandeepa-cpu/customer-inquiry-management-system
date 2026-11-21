import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/requireAuth.js';
import authRouter from './routes/auth.js';
import inquiriesRouter from './routes/inquiries.js';
import { createSessionMiddleware } from './session.js';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(createSessionMiddleware());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api', requireAuth);
app.use('/api/inquiries', inquiriesRouter);
app.use(errorHandler);

export default app;
