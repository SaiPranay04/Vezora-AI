/**
 * JWT Token Utilities
 * Handles token generation, verification, and refresh
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Tokens expire in 7 days
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // Refresh tokens expire in 30 days

/**
 * Generate access token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'vezora-ai',
      audience: 'vezora-users'
    });
  } catch (error) {
    console.error('❌ Token generation error:', error.message);
    throw new Error('Failed to generate token');
  }
}

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode
 * @returns {string} Refresh token
 */
export function generateRefreshToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'vezora-ai',
      audience: 'vezora-users'
    });
  } catch (error) {
    console.error('❌ Refresh token generation error:', error.message);
    throw new Error('Failed to generate refresh token');
  }
}

/**
 * Verify and decode token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'vezora-ai',
      audience: 'vezora-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      console.error('❌ Token verification error:', error.message);
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Decode token without verification (use for expired tokens)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload (without verification)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Token decode error:', error.message);
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export function isTokenExpired(token) {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
export function getTokenExpiration(token) {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration
};
