/**
 * List all available Gemini models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function listModels() {
  console.log('\n📋 Listing available Gemini models...\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const models = await genAI.listModels();
    
    console.log('✅ Available Models:\n');
    
    models.forEach(model => {
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log(`   Description: ${model.description}`);
      console.log('');
    });

    // Filter embedding models
    const embeddingModels = models.filter(m => 
      m.supportedGenerationMethods.includes('embedContent') ||
      m.name.includes('embedding')
    );

    if (embeddingModels.length > 0) {
      console.log('\n🎯 EMBEDDING MODELS:\n');
      embeddingModels.forEach(model => {
        console.log(`✅ ${model.name}`);
      });
    } else {
      console.log('\n⚠️  No embedding models found.');
      console.log('   Your API key might not have access to embedding models.');
      console.log('   This is okay - we can use a different approach!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🔗 Visit: https://aistudio.google.com/app/apikey');
    console.log('   to verify your API key settings.\n');
  }
}

listModels();
