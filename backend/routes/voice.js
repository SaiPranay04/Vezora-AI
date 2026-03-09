/**
 * Voice Routes - Text-to-Speech functionality
 */

import express from 'express';
import { textToSpeech, getAvailableVoices } from '../controllers/voiceController.js';
import { cleanTextForTTS } from '../utils/textCleaner.js';

const router = express.Router();

/**
 * POST /api/voice/speak
 * Convert text to speech
 */
router.post('/speak', async (req, res) => {
  try {
    const {
      text,
      voice = 'default',
      speed = 1.0,
      pitch = 1.0,
      language = 'en-US'
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text: Remove markdown and make voice-friendly
    const cleanText = cleanTextForTTS(text);
    console.log('🎤 [TTS] Original length:', text.length, '| Clean length:', cleanText.length);

    const audioData = await textToSpeech(cleanText, {
      voice,
      speed,
      pitch,
      language
    });

    // Return audio as base64 or file path
    res.json({
      audio: audioData.audio, // base64 or URL
      format: audioData.format,
      duration: audioData.duration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ TTS error:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error.message
    });
  }
});

/**
 * GET /api/voice/voices
 * Get available TTS voices
 */
router.get('/voices', async (req, res) => {
  try {
    const voices = await getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error('❌ Get voices error:', error);
    res.status(500).json({ error: 'Failed to get available voices' });
  }
});

/**
 * POST /api/voice/stream
 * Stream audio for voice call mode (WebSocket alternative)
 */
router.post('/stream', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text: Remove markdown and make voice-friendly
    const cleanText = cleanTextForTTS(text);
    console.log('🎤 [TTS Stream] Cleaned text for voice');

    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    const audioStream = await textToSpeech(cleanText, { stream: true });
    audioStream.pipe(res);
  } catch (error) {
    console.error('❌ Voice stream error:', error);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

export default router;
