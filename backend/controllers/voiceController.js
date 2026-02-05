/**
 * Voice Controller - Text-to-Speech functionality
 */

import GoogleTTS from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;
const USE_GOOGLE_TTS = !!GOOGLE_TTS_API_KEY;

let ttsClient = null;

// Initialize Google TTS client if API key is provided
if (USE_GOOGLE_TTS) {
  try {
    ttsClient = new GoogleTTS.TextToSpeechClient({
      apiKey: GOOGLE_TTS_API_KEY
    });
    console.log('✅ Google Cloud TTS initialized');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Google TTS:', error.message);
  }
}

/**
 * Convert text to speech
 */
export async function textToSpeech(text, options = {}) {
  const {
    voice = 'default',
    speed = 1.0,
    pitch = 1.0,
    language = 'en-US',
    stream = false
  } = options;

  if (USE_GOOGLE_TTS && ttsClient) {
    return await googleTTS(text, { voice, speed, pitch, language, stream });
  } else {
    // Fallback: Return instruction for browser TTS
    return {
      audio: null,
      format: 'browser-tts',
      text: text,
      duration: estimateDuration(text, speed),
      message: 'Use browser Web Speech API for TTS'
    };
  }
}

/**
 * Google Cloud TTS implementation
 */
async function googleTTS(text, options) {
  const { voice, speed, pitch, language } = options;

  const request = {
    input: { text },
    voice: {
      languageCode: language,
      name: voice !== 'default' ? voice : undefined,
      ssmlGender: 'NEUTRAL'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: speed,
      pitch: pitch
    }
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Convert audio to base64
    const audioBase64 = response.audioContent.toString('base64');
    
    return {
      audio: audioBase64,
      format: 'mp3',
      duration: estimateDuration(text, speed),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Google TTS error:', error);
    throw new Error(`TTS failed: ${error.message}`);
  }
}

/**
 * Get available voices
 */
export async function getAvailableVoices() {
  if (USE_GOOGLE_TTS && ttsClient) {
    try {
      const [result] = await ttsClient.listVoices({});
      return result.voices.map(voice => ({
        name: voice.name,
        languageCodes: voice.languageCodes,
        ssmlGender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz
      }));
    } catch (error) {
      console.error('❌ Failed to get voices:', error);
      return [];
    }
  }

  // Fallback: Return common browser voices
  return [
    { name: 'default', languageCodes: ['en-US'], ssmlGender: 'NEUTRAL' },
    { name: 'Google US English', languageCodes: ['en-US'], ssmlGender: 'FEMALE' },
    { name: 'Google UK English Male', languageCodes: ['en-GB'], ssmlGender: 'MALE' }
  ];
}

/**
 * Estimate speech duration (rough approximation)
 */
function estimateDuration(text, speed = 1.0) {
  // Average: ~150 words per minute, ~5 characters per word
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  const seconds = (minutes * 60) / speed;
  return Math.ceil(seconds);
}
