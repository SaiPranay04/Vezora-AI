/**
 * Vezora AI Assistant - Main Backend Server
 * Local LLM + Voice + Memory + Desktop Integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import authRoutes from './routes/auth.js';
import gmailRoutes from './routes/gmail.js';
import calendarRoutes from './routes/calendar.js';
import searchRoutes from './routes/search.js';
import workflowsRoutes from './routes/workflows.js';
import ocrRoutes from './routes/ocr.js';

// NEW: Context-aware memory and task routes
import structuredMemoryRoutes from './routes/structuredMemory.js';
import tasksRoutes from './routes/tasks.js';
import coordinatorRoutes from './routes/coordinator.js';
import profileRoutes from './routes/profile.js';

// Import utilities
import { initializeDatabase } from './utils/database.js';
import { ensureDataDirectories } from './utils/fileSystem.js';
// import { initializeGemini, isGeminiAvailable } from './utils/geminiClient.js'; // DISABLED - Using Groq only
import { isOllamaHealthy } from './utils/ollamaClient.js';
import { isGroqAvailable } from './utils/groqClient.js';
import { initializeWorkflowEngine } from './services/workflowEngine.js';
import { testEncryption } from './utils/encryption.js';

// NEW: PostgreSQL database initialization
import { initializePool, testConnection } from './config/database.js';

// NEW: Authentication routes
import authRoutesNew from './routes/authRoutes.js';

// NEW: Rate limiters
import { apiLimiter } from './middleware/rateLimiter.js';

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

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000", "https://vezora-server.onrender.com", "wss://vezora-server.onrender.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://vezora-ai.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Rate limiting for API routes
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Vezora AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  // const geminiAvailable = isGeminiAvailable(); // Gemini disabled
  const ollamaHealthy = await isOllamaHealthy();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    aiProviders: {
      groq: isGroqAvailable() ? 'available' : 'not configured',
      ollama: ollamaHealthy ? 'connected' : 'disconnected',
      active: 'groq'
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

// NEW: Multi-user authentication routes
app.use('/api/auth', authRoutesNew);

// Google OAuth routes
app.use('/api/gmail', gmailRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/ocr', ocrRoutes);

// NEW: Context-aware memory and task management
app.use('/api/structured-memory', structuredMemoryRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/profile', profileRoutes);

// Mount auth callback at root level for Google OAuth (matches redirect URI)
app.use('/auth', authRoutes);

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
    
    // Initialize database (SQLite for legacy features)
    await initializeDatabase();
    
    // NEW: Initialize PostgreSQL for multi-user features
    console.log('🔌 Connecting to PostgreSQL...');
    initializePool();
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log('✅ PostgreSQL connected successfully');
    } else {
      console.warn('⚠️  WARNING: PostgreSQL connection failed! Multi-user features will not work.');
      console.warn('   Set DATABASE_URL in .env to enable multi-user authentication.');
    }
    
    // Test encryption
    console.log('🔐 Testing encryption...');
    const encryptionWorking = testEncryption();
    if (!encryptionWorking) {
      console.warn('⚠️  WARNING: Encryption test failed! Check ENCRYPTION_KEY in .env');
    }
    
    // Initialize workflow engine
    await initializeWorkflowEngine();
    
    // Start server
    server.listen(PORT, async () => {
      console.log('\n🚀 Vezora AI Backend Server');
      console.log('================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ WebSocket available at ws://localhost:${PORT}/ws/voice-mode`);
      console.log(`✅ Auth endpoint: http://localhost:${PORT}/api/auth/google`);
      console.log('');
      
      // Initialize and check AI providers
      // initializeGemini(); // DISABLED - Using Groq only
      // const geminiAvailable = isGeminiAvailable();
      const ollamaHealthy = await isOllamaHealthy();
      
      console.log('🤖 AI Providers:');
      console.log(`   ✅ Groq: ACTIVE (${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'})`);
      
      if (ollamaHealthy) {
        console.log(`   ✅ Ollama: ACTIVE (${process.env.OLLAMA_MODEL_NAME || 'phi'})`);
      } else {
        console.log(`   ⚪ Ollama: Not running`);
      }
      
      // Show active provider
      const activeProvider = 'Groq';
      console.log(`   🎯 Primary: ${activeProvider}`);
      console.log('');
      
      console.log('🔧 Features:');
      console.log(`   ${process.env.VOICE_CALL_MODE === 'true' ? '✅' : '⚪'} Voice Call Mode`);
      console.log(`   ${process.env.ENABLE_APP_LAUNCH === 'true' ? '✅' : '⚪'} App Launch`);
      console.log(`   ${process.env.ENABLE_GMAIL === 'true' ? '✅' : '⚪'} Gmail Integration`);
      console.log(`   ${process.env.ENABLE_CALENDAR === 'true' ? '✅' : '⚪'} Calendar Integration`);
      console.log(`   ${process.env.ENABLE_WEB_SEARCH === 'true' ? '✅' : '⚪'} Web Search`);
      console.log(`   ${process.env.ENABLE_WORKFLOWS === 'true' ? '✅' : '⚪'} Workflow Automation`);
      console.log(`   ${process.env.ENABLE_GEMINI_GROUNDING === 'true' ? '✅' : '⚪'} Gemini Grounding`);
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
