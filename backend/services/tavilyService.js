import axios from 'axios';

/**
 * Perform a web search using the Tavily API
 * Best used for AI agent web research as it returns clean summaries
 */
export async function performWebSearch(query, limit = 5) {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is missing in the .env file. Web research is disabled.');
  }

  console.log(`🌐 [TAVILY] Searching the web for: "${query}"`);

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: query,
      search_depth: 'basic',
      include_answer: true,
      include_images: false,
      include_raw_content: false,
      max_results: limit
    });

    console.log(`✅ [TAVILY] Found ${response.data.results?.length || 0} results`);
    
    return {
      answer: response.data.answer,
      results: response.data.results || [],
      query
    };
  } catch (error) {
    console.error('❌ [TAVILY] Search failed:', error.response?.data || error.message);
    throw new Error(`Web search failed: ${error.message}`);
  }
}

export default { performWebSearch };
