// api/index.js
// Main Express app. On Vercel, every request to /api/* is routed into this
// single serverless function (see vercel.json), and Express handles routing
// internally from there.
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./auth');

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS only matters if you ever split frontend/backend onto different
// domains. For the single-Vercel-project setup this is same-origin, but it's
// harmless to leave on and saves pain if you change your mind later.
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
    credentials: true,
  })
);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

// fallback 404 for unknown /api/* routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
