// api/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signToken, requireAuth, COOKIE_NAME } = require('../middleware/auth');
const {
  isValidEmail,
  normalizeEmail,
  isValidPassword,
  isValidName,
  isValidDob,
} = require('../utils/validators');

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,          // requires HTTPS — true on Vercel
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * POST /api/auth/register
 * body: { fullName, email, password, dob? }
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, dob } = req.body || {};

    // ---- real validation (this is what was missing/broken before) ----
    if (!isValidName(fullName)) {
      return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include both letters and numbers.',
      });
    }
    if (!isValidDob(dob)) {
      return res.status(400).json({ error: 'Please enter a valid date of birth.' });
    }

    const normalizedEmail = normalizeEmail(email);

    // ---- check for existing account ----
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    // ---- hash password, never store plaintext ----
    const passwordHash = await bcrypt.hash(password, 12);

    const insertResult = await pool.query(
      `INSERT INTO users (full_name, email, dob, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, created_at`,
      [fullName.trim(), normalizedEmail, dob || null, passwordHash]
    );

    const user = insertResult.rows[0];

    const token = signToken({ id: user.id, email: user.email, full_name: user.full_name });
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(201).json({
      message: 'Registration successful.',
      user: { id: user.id, fullName: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error('[auth/register] error:', err);
    return res.status(500).json({ error: 'Something went wrong while creating your account. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Please enter your password.' });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await pool.query(
      'SELECT id, full_name, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Generic message on purpose — don't reveal whether the email exists.
    const genericError = 'Incorrect email or password.';

    if (result.rows.length === 0) {
      return res.status(401).json({ error: genericError });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: genericError });
    }

    const token = signToken({ id: user.id, email: user.email, full_name: user.full_name });
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      message: 'Login successful.',
      user: { id: user.id, fullName: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error('[auth/login] error:', err);
    return res.status(500).json({ error: 'Something went wrong while logging in. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current logged-in user, based on the session cookie/token.
 * Used by home.html to confirm auth before showing protected content.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = result.rows[0];
    return res.status(200).json({
      user: { id: user.id, fullName: user.full_name, email: user.email },
    });
  } catch (err) {
    console.error('[auth/me] error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  return res.status(200).json({ message: 'Logged out.' });
});

module.exports = router;
