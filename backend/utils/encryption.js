/**
 * Encryption Utilities - AES-256 Encryption
 * Implements encryption/decryption for sensitive data
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Ensure encryption key is valid
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn('⚠️ ENCRYPTION_KEY must be exactly 32 characters for AES-256!');
}

/**
 * Encrypt text using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
export function encrypt(text) {
  if (!ENCRYPTION_KEY) {
    console.warn('⚠️ No encryption key, returning plain text');
    return text;
  }

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'utf8'),
      iv
    );
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (both needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text encrypted with AES-256-CBC
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!ENCRYPTION_KEY) {
    console.warn('⚠️ No encryption key, returning as-is');
    return encryptedText;
  }

  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'utf8'),
      iv
    );
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for passwords)
 * @param {string} text - Text to hash
 * @returns {string} - SHA-256 hash
 */
export function hash(text) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}

/**
 * Generate random token (for session IDs, etc.)
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Random hex string
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt JSON object
 * @param {Object} obj - Object to encrypt
 * @returns {string} - Encrypted JSON string
 */
export function encryptObject(obj) {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString);
}

/**
 * Decrypt JSON object
 * @param {string} encryptedString - Encrypted JSON string
 * @returns {Object} - Decrypted object
 */
export function decryptObject(encryptedString) {
  const jsonString = decrypt(encryptedString);
  return JSON.parse(jsonString);
}

/**
 * Test encryption/decryption
 */
export function testEncryption() {
  try {
    const testData = {
      message: 'Hello Vezora!',
      timestamp: Date.now(),
      user: 'test@example.com'
    };
    
    console.log('\n🔐 Testing Encryption...');
    console.log('Original:', testData);
    
    const encrypted = encryptObject(testData);
    console.log('Encrypted:', encrypted.substring(0, 50) + '...');
    
    const decrypted = decryptObject(encrypted);
    console.log('Decrypted:', decrypted);
    
    const success = JSON.stringify(testData) === JSON.stringify(decrypted);
    console.log(success ? '✅ Encryption test passed!' : '❌ Encryption test failed!');
    
    return success;
  } catch (error) {
    console.error('❌ Encryption test failed:', error.message);
    return false;
  }
}
