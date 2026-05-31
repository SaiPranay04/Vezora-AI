/**
 * User Model
 * Handles user CRUD operations with SQLite
 */

import bcrypt from 'bcrypt';
import { getDatabase } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

export async function createUser({ email, password, name }) {
  const db = getDatabase();
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuidv4();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase(), password_hash, name, created_at, created_at);

    return { id, email, name, created_at };
  } catch (error) {
    console.error('❌ Create user error:', error.message);
    throw error;
  }
}

export async function getUserById(userId) {
  const db = getDatabase();
  try {
    return db.prepare('SELECT id, email, name, avatar_url, created_at, last_login FROM users WHERE id = ?').get(userId) || null;
  } catch (error) {
    console.error('❌ Get user by ID error:', error.message);
    throw error;
  }
}

export async function getUserByEmail(email) {
  const db = getDatabase();
  try {
    return db.prepare('SELECT id, email, name, avatar_url, created_at, last_login FROM users WHERE email = ?').get(email.toLowerCase()) || null;
  } catch (error) {
    console.error('❌ Get user by email error:', error.message);
    throw error;
  }
}

export async function getUserByEmailWithPassword(email) {
  const db = getDatabase();
  try {
    return db.prepare('SELECT id, email, password_hash, name, avatar_url, created_at, last_login FROM users WHERE email = ?').get(email.toLowerCase()) || null;
  } catch (error) {
    console.error('❌ Get user by email with password error:', error.message);
    throw error;
  }
}

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

    delete user.password_hash;
    await updateLastLogin(user.id);
    return user;
  } catch (error) {
    console.error('❌ Verify password error:', error.message);
    throw error;
  }
}

export async function updateUser(userId, updates) {
  const db = getDatabase();
  try {
    const allowedFields = ['name', 'avatar_url'];
    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    return await getUserById(userId);
  } catch (error) {
    console.error('❌ Update user error:', error.message);
    throw error;
  }
}

export async function updateUserPassword(userId, newPassword) {
  const db = getDatabase();
  try {
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(password_hash, new Date().toISOString(), userId);
    return true;
  } catch (error) {
    console.error('❌ Update password error:', error.message);
    throw error;
  }
}

export async function updateLastLogin(userId) {
  const db = getDatabase();
  try {
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), userId);
  } catch (error) {
    console.error('❌ Update last login error:', error.message);
  }
}

export async function deleteUser(userId) {
  const db = getDatabase();
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return result.changes > 0;
  } catch (error) {
    console.error('❌ Delete user error:', error.message);
    throw error;
  }
}

export async function getAllUsers() {
  const db = getDatabase();
  try {
    return db.prepare('SELECT id, email, name, avatar_url, created_at, last_login FROM users ORDER BY created_at DESC').all();
  } catch (error) {
    console.error('❌ Get all users error:', error.message);
    throw error;
  }
}

export async function getUserCount() {
  const db = getDatabase();
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return result.count;
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
