/**
 * User Model
 * Handles user CRUD operations with PostgreSQL
 */

import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

const SALT_ROUNDS = 10;

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Object} Created user (without password)
 */
export async function createUser({ email, password, name }) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), password_hash, name]
    );

    return result.rows[0];
  } catch (error) {
    console.error('❌ Create user error:', error.message);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User object or null
 */
export async function getUserById(userId) {
  try {
    const result = await query(
      'SELECT id, email, name, avatar_url, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get user by ID error:', error.message);
    throw error;
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Object|null} User object or null
 */
export async function getUserByEmail(email) {
  try {
    const result = await query(
      'SELECT id, email, name, avatar_url, created_at, last_login FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get user by email error:', error.message);
    throw error;
  }
}

/**
 * Get user by email with password (for authentication)
 * @param {string} email - User email
 * @returns {Object|null} User object with password_hash or null
 */
export async function getUserByEmailWithPassword(email) {
  try {
    const result = await query(
      'SELECT id, email, password_hash, name, avatar_url, created_at, last_login FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get user by email with password error:', error.message);
    throw error;
  }
}

/**
 * Verify user password
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Object|null} User object if valid, null if invalid
 */
export async function verifyUserPassword(email, password) {
  try {
    const user = await getUserByEmailWithPassword(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Remove password_hash before returning
    delete user.password_hash;

    // Update last login
    await updateLastLogin(user.id);

    return user;
  } catch (error) {
    console.error('❌ Verify password error:', error.message);
    throw error;
  }
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated user
 */
export async function updateUser(userId, updates) {
  try {
    const allowedFields = ['name', 'avatar_url'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    const result = await query(
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, email, name, avatar_url, created_at`,
      values
    );

    return result.rows[0];
  } catch (error) {
    console.error('❌ Update user error:', error.message);
    throw error;
  }
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New plain text password
 * @returns {boolean} Success status
 */
export async function updateUserPassword(userId, newPassword) {
  try {
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, userId]
    );

    return true;
  } catch (error) {
    console.error('❌ Update password error:', error.message);
    throw error;
  }
}

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 */
export async function updateLastLogin(userId) {
  try {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  } catch (error) {
    console.error('❌ Update last login error:', error.message);
  }
}

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {boolean} Success status
 */
export async function deleteUser(userId) {
  try {
    await query('DELETE FROM users WHERE id = $1', [userId]);
    return true;
  } catch (error) {
    console.error('❌ Delete user error:', error.message);
    throw error;
  }
}

/**
 * Get all users (admin only)
 * @returns {Array} Array of users
 */
export async function getAllUsers() {
  try {
    const result = await query(
      'SELECT id, email, name, avatar_url, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    return result.rows;
  } catch (error) {
    console.error('❌ Get all users error:', error.message);
    throw error;
  }
}

/**
 * Count total users
 * @returns {number} Total user count
 */
export async function getUserCount() {
  try {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('❌ Get user count error:', error.message);
    throw error;
  }
}

export default {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByEmailWithPassword,
  verifyUserPassword,
  updateUser,
  updateUserPassword,
  updateLastLogin,
  deleteUser,
  getAllUsers,
  getUserCount
};
