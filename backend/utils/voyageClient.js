/**
 * Voyage AI Embedding Client
 * Generates semantic embeddings for vector search
 * Using REST API directly for better compatibility
 */

import dotenv from 'dotenv';
dotenv.config();

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

/**
 * Check if Voyage AI is configured
 */
function isVoyageConfigured() {
  return !!process.env.VOYAGE_API_KEY;
}

/**
 * Generate embedding for a single text using REST API
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 1024-dimensional embedding vector
 */
export async function generateEmbedding(text) {
  if (!isVoyageConfigured()) {
    console.warn('⚠️  Voyage AI not configured, returning null embedding');
    return null;
  }

  if (!text || text.trim().length === 0) {
    console.warn('⚠️  Empty text provided, returning null embedding');
    return null;
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({
        input: [text],
        model: 'voyage-3', // 1024 dimensions, best quality
        input_type: 'document' // For storing in database
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Voyage API error:', response.status, error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Embedding generation error:', error.message);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * More efficient for bulk operations
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts) {
  if (!isVoyageConfigured()) {
    console.warn('⚠️  Voyage AI not configured, returning null embeddings');
    return texts.map(() => null);
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({
        input: texts,
        model: 'voyage-3',
        input_type: 'document'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Voyage API batch error:', response.status, error);
      return texts.map(() => null);
    }

    const data = await response.json();
    return data.data.map(item => item.embedding);
  } catch (error) {
    console.error('❌ Batch embedding generation error:', error.message);
    return texts.map(() => null);
  }
}

/**
 * Generate query embedding (optimized for search)
 * @param {string} query - Search query
 * @returns {Promise<number[]>} - 1024-dimensional embedding vector
 */
export async function generateQueryEmbedding(query) {
  if (!isVoyageConfigured()) {
    console.warn('⚠️  Voyage AI not configured, returning null embedding');
    return null;
  }

  if (!query || query.trim().length === 0) {
    console.warn('⚠️  Empty query provided, returning null embedding');
    return null;
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
      },
      body: JSON.stringify({
        input: [query],
        model: 'voyage-3',
        input_type: 'query' // Optimized for queries
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Voyage API query error:', response.status, error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Query embedding generation error:', error.message);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score (0-1, higher = more similar)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Check if Voyage AI is available
 */
export function isVoyageAvailable() {
  return isVoyageConfigured();
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateQueryEmbedding,
  cosineSimilarity,
  isVoyageAvailable
};
