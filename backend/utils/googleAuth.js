/**
 * Google OAuth 2.0 Authentication Handler
 * Handles Gmail and Google Calendar API authentication
 */

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Token storage path
const TOKEN_PATH = path.join(__dirname, '../data/google-tokens.json');

/**
 * Get OAuth credentials from environment (lazy loaded)
 * @returns {Object} - { clientId, clientSecret, redirectUri }
 */
function getOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
  
  return { clientId, clientSecret, redirectUri };
}

// Scopes for Gmail and Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getOAuthCredentials();
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing Google OAuth credentials in .env:');
    console.error('   GOOGLE_CLIENT_ID:', clientId ? '✅ SET' : '❌ NOT SET');
    console.error('   GOOGLE_CLIENT_SECRET:', clientSecret ? '✅ SET' : '❌ NOT SET');
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Generate authorization URL for user login
 * @returns {string} - Authorization URL
 */
export function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from callback
 * @returns {Object} - Tokens object
 */
export async function getTokensFromCode(code) {
  const oauth2Client = createOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens to file
    await saveTokens(tokens);
    
    console.log('✅ Google tokens obtained and saved');
    return tokens;
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
    throw error;
  }
}

/**
 * Save tokens to file
 * @param {Object} tokens - Tokens object
 */
async function saveTokens(tokens) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(TOKEN_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save tokens
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('💾 Tokens saved to:', TOKEN_PATH);
  } catch (error) {
    console.error('❌ Error saving tokens:', error.message);
    throw error;
  }
}

/**
 * Load tokens from file
 * @returns {Object|null} - Tokens object or null if not found
 */
export async function loadTokens() {
  try {
    const tokensData = await fs.readFile(TOKEN_PATH, 'utf8');
    return JSON.parse(tokensData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('ℹ️ No saved tokens found');
      return null;
    }
    console.error('❌ Error loading tokens:', error.message);
    throw error;
  }
}

/**
 * Get authenticated OAuth2 client
 * @returns {OAuth2Client} - Authenticated client
 */
export async function getAuthenticatedClient() {
  const oauth2Client = createOAuth2Client();
  
  // Load saved tokens
  const tokens = await loadTokens();
  
  if (!tokens) {
    throw new Error('No tokens found. User needs to authenticate first.');
  }
  
  // Set credentials
  oauth2Client.setCredentials(tokens);
  
  // Handle token refresh
  oauth2Client.on('tokens', async (newTokens) => {
    console.log('🔄 Tokens refreshed');
    
    // Merge with existing tokens (refresh token is only sent once)
    const updatedTokens = { ...tokens, ...newTokens };
    await saveTokens(updatedTokens);
  });
  
  return oauth2Client;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if tokens exist
 */
export async function isAuthenticated() {
  try {
    const tokens = await loadTokens();
    return tokens !== null && tokens.access_token !== undefined;
  } catch (error) {
    return false;
  }
}

/**
 * Revoke tokens (logout)
 */
export async function revokeTokens() {
  try {
    const oauth2Client = await getAuthenticatedClient();
    await oauth2Client.revokeCredentials();
    
    // Delete token file
    await fs.unlink(TOKEN_PATH);
    
    console.log('✅ Tokens revoked successfully');
  } catch (error) {
    console.error('❌ Error revoking tokens:', error.message);
    throw error;
  }
}

/**
 * Get Gmail API client
 * @returns {gmail_v1.Gmail} - Gmail API client
 */
export async function getGmailClient() {
  const auth = await getAuthenticatedClient();
  return google.gmail({ version: 'v1', auth });
}

/**
 * Get Calendar API client
 * @returns {calendar_v3.Calendar} - Calendar API client
 */
export async function getCalendarClient() {
  const auth = await getAuthenticatedClient();
  return google.calendar({ version: 'v3', auth });
}

/**
 * Test authentication status
 */
export async function testAuth() {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log('❌ Not authenticated');
      console.log('🔗 Get auth URL:', getAuthUrl());
      return false;
    }
    
    // Try to fetch Gmail profile
    const gmail = await getGmailClient();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log('✅ Authenticated as:', profile.data.emailAddress);
    console.log('📧 Total messages:', profile.data.messagesTotal);
    
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}
