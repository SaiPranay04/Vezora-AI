/**
 * OCR and Document Scanning Routes
 * Extract text from images and PDFs
 */

import express from 'express';
import Tesseract from 'tesseract.js';

const router = express.Router();

/**
 * POST /api/ocr/image
 * Extract text from image using OCR
 */
router.post('/image', async (req, res) => {
  try {
    const { image, lang = 'eng' } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    console.log('🔍 Starting OCR...');
    
    // Perform OCR
    const result = await Tesseract.recognize(
      image,
      lang,
      {
        logger: m => console.log(m.status, m.progress)
      }
    );
    
    res.json({
      success: true,
      text: result.data.text,
      confidence: result.data.confidence,
      language: lang,
      words: result.data.words?.length || 0
    });
  } catch (error) {
    console.error('❌ OCR error:', error.message);
    res.status(500).json({ error: 'OCR failed', details: error.message });
  }
});

/**
 * POST /api/ocr/pdf
 * Extract text from PDF (NOT IMPLEMENTED - requires different library)
 */
router.post('/pdf', async (req, res) => {
  res.status(501).json({ 
    error: 'PDF parsing not implemented yet',
    message: 'Use a dedicated PDF library or service for PDF text extraction'
  });
});

/**
 * POST /api/ocr/batch
 * Process multiple images
 */
router.post('/batch', async (req, res) => {
  try {
    const { images, lang = 'eng' } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }
    
    console.log(`🔍 Processing ${images.length} images...`);
    
    const results = await Promise.all(
      images.map(async (image, index) => {
        try {
          const result = await Tesseract.recognize(image, lang);
          return {
            index,
            success: true,
            text: result.data.text,
            confidence: result.data.confidence
          };
        } catch (error) {
          return {
            index,
            success: false,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      results,
      total: images.length,
      successful: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('❌ Batch OCR error:', error.message);
    res.status(500).json({ error: 'Batch OCR failed', details: error.message });
  }
});

export default router;
