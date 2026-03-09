/**
 * Rate Limiting Middleware
 * Prevents API abuse and DDoS attacks
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Applies to all /api/* routes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiter for AI endpoints
 * AI calls are expensive, limit more strictly
 */
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 AI requests per minute
  message: {
    error: 'Too many AI requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'AI rate limit exceeded',
      message: 'You are making too many AI requests. Please wait before trying again.',
      retryAfter: '1 minute'
    });
  }
});

/**
 * Authentication rate limiter
 * Prevents brute force login attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Password reset rate limiter
 * Prevents password reset abuse
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * File upload rate limiter
 * Prevents abuse of file upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads per 15 minutes
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  apiLimiter,
  aiLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter
};
