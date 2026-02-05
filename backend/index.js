/**
 * Vezora AI Assistant - Main Backend Server
 * Local LLM + Voice + Memory + Desktop Integration
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if Gemini API key is loaded
console.log('🔍 DEBUG: Checking environment variables...');
console.log('🔍 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `SET (${process.env.GEMINI_API_KEY.substring(0, 15)}...)` : 'NOT SET');
console.log('🔍 AI_PROVIDER:', process.env.AI_PROVIDER || 'not set');
console.log('🔍 Working directory:', process.cwd());
console.log('');

// Import routes
import chatRoutes from './routes/chat.js';
import memoryRoutes from './routes/memory.js';
import voiceRoutes from './routes/voice.js';
import settingsRoutes from './routes/settings.js';
import filesRoutes from './routes/files.js';
import appsRoutes from './routes/apps.js';
import logsRoutes from './routes/logs.js';

// Import utilities
import { initializeDatabase } from './utils/database.js';
import { ensureDataDirectories } from './utils/fileSystem.js';
import { initializeGemini, isGeminiAvailable } from './utils/geminiClient.js';
import { isOllamaHealthy } from './utils/ollamaClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket server for voice call mode
const wss = new WebSocketServer({ server, path: '/ws/voice-mode' });

wss.on('connection', (ws) => {
  console.log('📞 Voice call mode: Client connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📞 Received:', message);
      // Handle voice call interactions
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('📞 Voice call mode: Client disconnected');
  });
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const geminiAvailable = isGeminiAvailable();
  const ollamaHealthy = await isOllamaHealthy();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    aiProviders: {
      gemini: geminiAvailable ? 'available' : 'not configured',
      ollama: ollamaHealthy ? 'connected' : 'disconnected',
      active: process.env.AI_PROVIDER === 'ollama' ? 'ollama' : 
              (geminiAvailable ? 'gemini' : 
              (ollamaHealthy ? 'ollama' : 'none'))
    },
    features: {
      voiceCallMode: process.env.VOICE_CALL_MODE === 'true',
      appLaunch: process.env.ENABLE_APP_LAUNCH === 'true',
      fileSystem: process.env.ENABLE_FILE_SYSTEM === 'true'
    }
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/logs', logsRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Internal server error',
      status: error.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      path: req.path
    }
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Ensure data directories exist
    await ensureDataDirectories();
    
    // Initialize database (SQLite)
    await initializeDatabase();
    
    // Start server
    server.listen(PORT, async () => {
      console.log('\n🚀 Vezora AI Backend Server');
      console.log('================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket available at ws://localhost:${PORT}/ws/voice-mode`);
      console.log('');
      
      // Initialize and check AI providers
      initializeGemini(); // Initialize Gemini before checking availability
      const geminiAvailable = isGeminiAvailable();
      const ollamaHealthy = await isOllamaHealthy();
      
      console.log('🤖 AI Providers:');
      if (geminiAvailable) {
        console.log(`   ✅ Gemini: ACTIVE (${process.env.GEMINI_MODEL || 'gemini-pro'})`);
      } else {
        console.log(`   ⚪ Gemini: Not configured`);
      }
      
      if (ollamaHealthy) {
        console.log(`   ✅ Ollama: ACTIVE (${process.env.OLLAMA_MODEL_NAME || 'phi'})`);
      } else {
        console.log(`   ⚪ Ollama: Not running`);
      }
      
      // Show active provider
      const activeProvider = process.env.AI_PROVIDER === 'ollama' ? 'Ollama' : 
                            (geminiAvailable ? 'Gemini' : 
                            (ollamaHealthy ? 'Ollama' : 'None'));
      console.log(`   🎯 Primary: ${activeProvider}`);
      console.log('');
      
      console.log(`✅ Voice Call Mode: ${process.env.VOICE_CALL_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`✅ App Launch: ${process.env.ENABLE_APP_LAUNCH === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log('================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📪 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📪 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
