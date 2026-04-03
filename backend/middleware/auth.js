/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to requests
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { getUserById } from '../models/User.js';

/**
 * Verify JWT token and attach user to request
 * Usage: Add as middleware to protected routes
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided. Please login to access this resource.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: error.message
      });
    }

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists.'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication.'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work with or without auth
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      req.userId = null;
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user.id;
      } else {
        req.user = null;
        req.userId = null;
      }
    } catch (error) {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    console.error('❌ Optional auth error:', error.message);
    req.user = null;
    req.userId = null;
    next();
  }
}

/**
 * Check if user is admin
 * Use after authenticate middleware
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required.'
    });
  }
  next();
}

/**
 * Validate user owns resource
 * Checks if req.userId matches resource owner
 */
export function validateOwnership(resourceUserId) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
    }

    if (req.userId !== resourceUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
}

/**
 * Extract userId from request (from auth middleware or query param)
 * Fallback to 'default' for backward compatibility during migration
 */
export function getUserIdFromRequest(req) {
  // Priority 1: Authenticated user ID (from JWT — trusted)
  if (req.userId) {
    return req.userId;
  }

  // Priority 2: Query parameter (ONLY when not authenticated — for testing/migration)
  if (req.query.userId) {
    return req.query.userId;
  }

  // Priority 3: Body parameter (ONLY when not authenticated — for migration)
  if (req.body && req.body.userId) {
    return req.body.userId;
  }

  // Fallback: Use 'default' for backward compatibility
  // TODO: Remove this fallback after full migration
  return 'default';
}

export default {
  authenticate,
  optionalAuth,
  requireAdmin,
  validateOwnership,
  getUserIdFromRequest
};
