/**
 * Google OAuth Authentication Routes
 * Handles OAuth flow for Gmail and Calendar
 */

import express from 'express';
import { getAuthUrl, getTokensFromCode, isAuthenticated, revokeTokens, testAuth } from '../utils/googleAuth.js';

const router = express.Router();

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({
      authUrl,
      message: 'Open this URL in browser to authenticate'
    });
  } catch (error) {
    console.error('❌ Auth URL error:', error.message);
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
});

/**
 * GET /auth/google/callback (Note: no /api prefix for OAuth callback)
 * OAuth callback endpoint
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('<h1>❌ Error: Missing authorization code</h1><p><a href="/auth-test.html">Go Back</a></p>');
    }
    
    // Exchange code for tokens
    await getTokensFromCode(code);
    
    console.log('✅ Google OAuth successful! Tokens saved.');
    
    // Redirect to auth test page with success message
    res.redirect('/auth-test.html?success=true');
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    res.redirect(`/auth-test.html?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', async (req, res) => {
  try {
    const authenticated = await isAuthenticated();
    
    res.json({
      authenticated,
      message: authenticated ? 'Authenticated' : 'Not authenticated'
    });
  } catch (error) {
    console.error('❌ Auth status error:', error.message);
    res.status(500).json({ error: 'Failed to check auth status', details: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Revoke tokens and logout
 */
router.post('/logout', async (req, res) => {
  try {
    await revokeTokens();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ error: 'Failed to logout', details: error.message });
  }
});

/**
 * GET /api/auth/test
 * Test authentication
 */
router.get('/test', async (req, res) => {
  try {
    const success = await testAuth();
    
    res.json({
      success,
      message: success ? 'Authentication working' : 'Authentication failed'
    });
  } catch (error) {
    console.error('❌ Auth test error:', error.message);
    res.status(500).json({ error: 'Auth test failed', details: error.message });
  }
});

export default router;
