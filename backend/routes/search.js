/**
 * Web Search Routes
 * Uses Gemini Grounding for real-time web search
 */

import express from 'express';
import { generateGeminiCompletion, isGeminiAvailable } from '../utils/geminiClient.js';

const router = express.Router();

/**
 * POST /api/search
 * Perform web search using Gemini grounding
 */
router.post('/', async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Check if Gemini grounding is enabled
    const useGeminiGrounding = process.env.ENABLE_GEMINI_GROUNDING === 'true';
    
    if (!useGeminiGrounding || !isGeminiAvailable()) {
      return res.status(503).json({
        error: 'Web search not available',
        message: 'Enable ENABLE_GEMINI_GROUNDING=true in .env and ensure GEMINI_API_KEY is set'
      });
    }
    
    // Create search prompt
    const searchPrompt = `Search the web and provide current information about: "${query}"
    
Please provide:
1. A clear, concise answer
2. Key facts and details
3. Sources (URLs where you found the information)
4. Publication dates if relevant

Format your response as JSON with this structure:
{
  "answer": "main answer here",
  "facts": ["fact 1", "fact 2", "fact 3"],
  "sources": [
    {"title": "source title", "url": "https://...", "snippet": "brief description"}
  ]
}`;
    
    const messages = [
      { role: 'user', content: searchPrompt }
    ];
    
    // Generate response with Gemini (grounding happens automatically if enabled in Gemini API)
    const response = await generateGeminiCompletion(messages);
    
    // Try to parse JSON response
    let searchResults;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      searchResults = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, return as plain text
      searchResults = {
        answer: response,
        facts: [],
        sources: []
      };
    }
    
    res.json({
      query,
      results: searchResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Web search error:', error.message);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

/**
 * GET /api/search/quick
 * Quick search with simple answer
 */
router.get('/quick', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const useGeminiGrounding = process.env.ENABLE_GEMINI_GROUNDING === 'true';
    
    if (!useGeminiGrounding || !isGeminiAvailable()) {
      return res.status(503).json({
        error: 'Web search not available'
      });
    }
    
    const messages = [
      { role: 'user', content: `Briefly answer this question using current web information: ${q}` }
    ];
    
    const answer = await generateGeminiCompletion(messages);
    
    res.json({
      query: q,
      answer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Quick search error:', error.message);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

export default router;
