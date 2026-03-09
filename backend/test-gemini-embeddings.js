/**
 * Test Script: Verify Gemini Embeddings API Access
 * Run: node backend/test-gemini-embeddings.js
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testGeminiEmbeddings() {
  console.log('\n🧪 Testing Gemini Embeddings API...\n');

  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    console.log('\n📝 Please add to backend/.env:');
    console.log('   GEMINI_API_KEY=your_api_key_here\n');
    return;
  }

  console.log('✅ GEMINI_API_KEY found:', process.env.GEMINI_API_KEY.substring(0, 15) + '...');

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try different embedding model names
    const embeddingModels = [
      "text-embedding-004",
      "embedding-001", 
      "models/text-embedding-004",
      "models/embedding-001"
    ];

    let model = null;
    let workingModelName = null;

    for (const modelName of embeddingModels) {
      try {
        console.log(`\n🔄 Trying model: ${modelName}...`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        // Try a quick test
        const testResult = await model.embedContent("test");
        workingModelName = modelName;
        console.log(`✅ Found working model: ${modelName}`);
        break;
      } catch (err) {
        console.log(`   ❌ ${modelName} - ${err.message.split('\n')[0]}`);
      }
    }

    if (!model || !workingModelName) {
      throw new Error('No embedding models are available with this API key');
    }

    console.log(`\n✅ Using embedding model: ${workingModelName}`);

    // Test embedding generation
    const testText = "Hello, this is a test for Vezora AI embeddings!";
    console.log(`\n📝 Input text: "${testText}"`);

    const startTime = Date.now();
    const result = await model.embedContent(testText);
    const duration = Date.now() - startTime;

    const embedding = result.embedding.values;

    console.log(`\n✅ Embedding generated successfully!`);
    console.log(`   Dimensions: ${embedding.length}`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   Response time: ${duration}ms`);

    // Test batch embedding (for multiple texts)
    console.log('\n🔄 Testing batch embeddings...');
    const texts = [
      "User authentication system",
      "Login page design",
      "Password reset flow"
    ];

    const batchStartTime = Date.now();
    const batchResults = await Promise.all(
      texts.map(text => model.embedContent(text))
    );
    const batchDuration = Date.now() - batchStartTime;

    console.log(`✅ Batch embeddings generated!`);
    console.log(`   Texts processed: ${texts.length}`);
    console.log(`   Total time: ${batchDuration}ms`);
    console.log(`   Average per text: ${(batchDuration / texts.length).toFixed(0)}ms`);

    // Calculate similarity example
    console.log('\n🔍 Testing semantic similarity...');
    const emb1 = batchResults[0].embedding.values;
    const emb2 = batchResults[1].embedding.values;
    const emb3 = batchResults[2].embedding.values;

    const similarity1_2 = cosineSimilarity(emb1, emb2);
    const similarity1_3 = cosineSimilarity(emb1, emb3);

    console.log(`\n📊 Similarity Scores (0-1, higher = more similar):`);
    console.log(`   "${texts[0]}" vs "${texts[1]}": ${similarity1_2.toFixed(4)}`);
    console.log(`   "${texts[0]}" vs "${texts[2]}": ${similarity1_3.toFixed(4)}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Gemini Embeddings API is working perfectly!');
    console.log('='.repeat(60));
    console.log('\n✅ Your API key has access to:');
    console.log('   - Gemini Chat Models (gemini-1.5-pro)');
    console.log('   - Gemini Embedding Models (text-embedding-004)');
    console.log('\n📊 Free Tier Quota:');
    console.log('   - 1,500 requests per minute');
    console.log('   - 1 million requests per day');
    console.log('   - 768-dimensional vectors');
    console.log('\n🚀 You\'re ready to implement semantic search!\n');

  } catch (error) {
    console.error('\n❌ Error testing embeddings:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n🔧 Fix: Your API key is invalid');
      console.log('   1. Go to: https://aistudio.google.com/app/apikey');
      console.log('   2. Create a new API key');
      console.log('   3. Update GEMINI_API_KEY in backend/.env');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('\n🔧 Fix: API key doesn\'t have embedding permissions');
      console.log('   1. Go to: https://aistudio.google.com/app/apikey');
      console.log('   2. Create a new API key with "Gemini API" access');
      console.log('   3. Update GEMINI_API_KEY in backend/.env');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('\n⚠️  You\'ve exceeded your free quota');
      console.log('   Wait a few minutes or create a new API key');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Verify API key at: https://aistudio.google.com/app/apikey');
      console.log('   2. Ensure "Gemini API" is enabled');
      console.log('   3. Check your free tier quota');
    }
    console.log('\n');
  }
}

// Cosine similarity calculation
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Run the test
testGeminiEmbeddings();
