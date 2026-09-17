import express from 'express';
import { streamTTS } from '../services/ttsService.js';

const router = express.Router();

/**
 * @desc Generate TTS audio stream from text
 * @route POST /api/tts
 */
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim() || text.length > 10000) {
    return res.status(400).json({ error: 'Text field is required' });
  }

  try {
    // Stream audio directly back to client
    await streamTTS(text, res);
  } catch (error) {
    console.error('TTS Route Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio' });
    }
  }
});

export default router;
