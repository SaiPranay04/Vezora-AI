/**
 * Authentication Routes
 * Handles user registration, login, and token refresh
 */

import express from 'express';
import { createUser, verifyUserPassword, getUserById } from '../models/User.js';
import { generateToken, verifyToken, revokeToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required.'
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256 || (name !== undefined && typeof name !== 'string')) return res.status(400).json({ error: 'Invalid credentials' });
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address.'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Create user
    const user = await createUser({
      email,
      password,
      name: name || email.split('@')[0] // Default name from email
    });

    // Generate tokens
    const token = generateToken({ userId: user.id, email: user.email });
    const refreshToken = null;

    console.log('✅ New user registered:', user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'User exists',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required.'
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) return res.status(400).json({ error: 'Invalid credentials' });
    // Verify credentials
    const user = await verifyUserPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect.'
      });
    }

    // Generate tokens
    const token = generateToken({ userId: user.id, email: user.email });
    const refreshToken = null;

    console.log('✅ User logged in:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        last_login: user.last_login
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login. Please try again.'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (_req, res) => res.status(403).json({ error: 'Refresh disabled until durable rotation is implemented; sign in again.' }));

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Get user info error:', error.message);
    res.status(500).json({
      error: 'Failed to get user info',
      message: 'An error occurred while fetching user information.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal, server logs event)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    revokeToken(req.headers.authorization.slice(7));
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout.'
    });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify if a token is valid
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Token is required.'
      });
    }

    try {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);

      if (!user) {
        return res.json({
          valid: false,
          message: 'User not found'
        });
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      res.json({
        valid: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    res.status(500).json({
      error: 'Verification failed',
      message: 'An error occurred during token verification.'
    });
  }
});

export default router;
