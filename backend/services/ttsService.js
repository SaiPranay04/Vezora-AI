import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to piper executable and model
const PIPER_DIR = path.join(__dirname, '..', 'bin', 'piper');
const PIPER_EXE = path.join(PIPER_DIR, 'piper.exe');
const VOICE_MODEL = process.env.PIPER_VOICE_MODEL || path.join(PIPER_DIR, 'en_US-lessac-medium.onnx');

/**
 * Ensures piper binaries and models are available before running
 */
function verifyPiperAvailable() {
  if (!fs.existsSync(PIPER_EXE)) {
    console.error(`❌ Piper binary not found at ${PIPER_EXE}`);
    return false;
  }
  if (!fs.existsSync(VOICE_MODEL)) {
    console.error(`❌ Piper voice model not found at ${VOICE_MODEL}`);
    return false;
  }
  return true;
}

/**
 * Generate TTS audio stream from Text using Piper Engine
 * @param {string} text The string to read
 * @param {import('express').Response} res Express response object to stream audio directly
 */
export async function streamTTS(text, res) {
  if (!verifyPiperAvailable()) {
    return res.status(500).json({ error: 'Piper TTS Engine is not correctly installed or configured on the server.' });
  }

  const cleanText = text.replace(/\*/g, '').trim();
  
  // Create a temporary file path
  const tempDir = path.join(__dirname, '..', 'data', 'temp');
  await fsPromises.mkdir(tempDir, { recursive: true });
  
  const tempWav = path.join(tempDir, `${uuidv4()}.wav`);

  // Spawn piper process to output to FILE instead of STDOUT 
  // This completely prevents Windows from mutating 0x0A to 0x0D0A (CRLF binary corruption)!
  const piperProcess = spawn(PIPER_EXE, ['-m', VOICE_MODEL, '-f', tempWav], {
    stdio: ['pipe', 'ignore', 'pipe']
  });

  piperProcess.stdin.write(cleanText);
  piperProcess.stdin.end();

  piperProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Piper process exited with code ${code}`);
      if (!res.headersSent) res.status(500).end();
      return;
    }

    // Stream the file back to the user
    if (fs.existsSync(tempWav)) {
      res.setHeader('Content-Type', 'audio/wav');
      const readStream = fs.createReadStream(tempWav);
      
      readStream.pipe(res);
      
      // Cleanup file after stream finishes
      readStream.on('end', () => {
        fs.unlink(tempWav, (err) => {
          if (err) console.error(`❌ Failed to delete temp audio file: ${err.message}`);
        });
      });
    } else {
      if (!res.headersSent) res.status(500).json({ error: 'Failed to generate audio file' });
    }
  });

  piperProcess.on('error', (err) => {
    console.error('❌ Failed to start Piper subprocess:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });
}

export default { streamTTS };
