// server.js
// Local development entry point only. Vercel does NOT use this file — it
// invokes api/index.js directly as a serverless function. This file exists
// so you can run `npm run dev` locally and test against http://localhost:3000.
require('dotenv').config();
const app = require('./api/index');
const path = require('path');
const express = require('express');

// Serve the static frontend locally so register/login/home work the same
// way they will on Vercel (same-origin /api calls).
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Growth Sphere running locally at http://localhost:${PORT}`);
});
