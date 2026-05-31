import axios from 'axios';

/**
 * Extract clean Markdown content from any given URL using the free Jina Reader API
 * Great for reading articles and passing exactly what the AI needs, without HTML bloat.
 */
export async function extractUrlMarkdown(url) {
  if (!url) {
    throw new Error('URL is required for extraction');
  }

  console.log(`📄 [JINA] Extracting markdown from: ${url}`);

  try {
    // Jina Reader API is fully free and structured specifically for LLMs.
    // It accepts standard URLs prefixed with https://r.jina.ai/
    const response = await axios.get(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain', // Return raw markdown
      },
      timeout: 10000 // 10 second timeout for parsing
    });

    // Content sits in response.data directly as plain text markdown
    const markdownOutput = response.data;
    
    console.log(`✅ [JINA] Extracted ${markdownOutput.length} characters of markdown`);
    return markdownOutput;
  } catch (error) {
    console.error('❌ [JINA] Extraction failed for url:', url, '| Error:', error.message);
    throw new Error(`Failed to extract content from URL: ${url}`);
  }
}

export default { extractUrlMarkdown };
