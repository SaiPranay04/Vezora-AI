/**
 * Voice Call Hook - Manage voice call mode interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoice } from './useVoice';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export interface UseVoiceCallReturn {
  isVoiceCallActive: boolean;
  transcript: string;
  response: string;
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  startVoiceCall: () => void;
  endVoiceCall: () => void;
  toggleMute: () => void;
  toggleListen: () => void;
}

export function useVoiceCall(): UseVoiceCallReturn {
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    isListening, 
    isSpeaking, 
    transcript: voiceTranscript,
    startListening, 
    stopListening, 
    speak, 
    cancelSpeech,
    setTranscript: clearVoiceTranscript
  } = useVoice();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastProcessedTranscript = useRef<string>('');

  /**
   * Watch for new transcript and process it
   */
  useEffect(() => {
    if (!isVoiceCallActive || !voiceTranscript || isProcessing) return;
    if (voiceTranscript === lastProcessedTranscript.current) return;

    lastProcessedTranscript.current = voiceTranscript;
    setDisplayTranscript(voiceTranscript);
    handleSpeechRecognized(voiceTranscript);
  }, [voiceTranscript, isVoiceCallActive, isProcessing]);

  /**
   * Handle recognized speech with STREAMING and CHUNKED VOICE PLAYBACK
   */
  const handleSpeechRecognized = useCallback(async (recognizedText: string) => {
    if (!recognizedText.trim()) return;
    
    setIsProcessing(true);
    stopListening(); // Stop listening while processing
    setResponse(''); // Clear previous response

    try {
      // Immediately indicate processing
      if (!isMuted) {
        speak("One moment"); // Quick feedback
      }

      // Use streaming endpoint for real-time responses
      const fetchResponse = await fetch(`${BACKEND_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: recognizedText,
          includeMemory: false, // Disabled for speed
          userId: 'default'
        })
      });

      if (!fetchResponse.ok) {
        throw new Error('Failed to get streaming response from backend');
      }

      const reader = fetchResponse.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let sentenceQueue: string[] = [];
      let isSpeakingChunk = false;

      // Process streaming chunks
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk' && data.content) {
                const sentence = data.content.trim();
                fullResponse += sentence + ' ';
                setResponse(fullResponse.trim());

                // Add to sentence queue for voice playback
                if (!isMuted) {
                  sentenceQueue.push(sentence);
                  
                  // Start speaking if not already speaking
                  if (!isSpeakingChunk && sentenceQueue.length > 0) {
                    isSpeakingChunk = true;
                    speakNextSentence();
                  }
                }
              } else if (data.type === 'done') {
                fullResponse = data.fullResponse || fullResponse;
                setResponse(fullResponse.trim());
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.warn('Stream parse error:', e);
            }
          }
        }
      }

      // Helper to speak sentences from queue
      async function speakNextSentence() {
        while (sentenceQueue.length > 0) {
          const sentence = sentenceQueue.shift();
          if (sentence) {
            // Speak immediately (non-blocking)
            speak(sentence);
            // Wait for this sentence to finish before next
            await new Promise(resolve => setTimeout(resolve, sentence.length * 50 + 500));
          }
        }
        isSpeakingChunk = false;
      }

      // Wait a bit for final speech to complete, then restart listening
      setTimeout(() => {
        setIsProcessing(false);
        if (isVoiceCallActive) {
          clearVoiceTranscript('');
          lastProcessedTranscript.current = '';
          startListening();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Voice call error:', error);
      
      // Fallback to non-streaming
      try {
        const fallbackResponse = await fetch(`${BACKEND_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: recognizedText,
            includeMemory: false,
            userId: 'default'
          })
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setResponse(data.content);
          if (!isMuted) speak(data.content);
        } else {
          throw new Error('Fallback also failed');
        }
      } catch (fallbackError) {
        setResponse('Sorry, I encountered an error.');
        if (!isMuted) speak('Sorry, I encountered an error');
      }

      setIsProcessing(false);
      
      // Retry listening after error
      setTimeout(() => {
        if (isVoiceCallActive) {
          clearVoiceTranscript('');
          lastProcessedTranscript.current = '';
          startListening();
        }
      }, 2000);
    }
  }, [isMuted, isVoiceCallActive, speak, stopListening, startListening, clearVoiceTranscript]);

  /**
   * Play audio from backend (base64 or URL)
   */
  const playAudio = useCallback(async (audioData: string) => {
    try {
      // If base64, convert to blob URL
      let audioUrl = audioData;
      if (audioData.startsWith('data:') || !audioData.startsWith('http')) {
        const audioBlob = base64ToBlob(audioData, 'audio/mp3');
        audioUrl = URL.createObjectURL(audioBlob);
      }

      // Create and play audio
      audioRef.current = new Audio(audioUrl);
      await audioRef.current.play();

      // Clean up blob URL after playing
      audioRef.current.addEventListener('ended', () => {
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, []);

  /**
   * Start voice call mode
   */
  const startVoiceCall = useCallback(() => {
    setIsVoiceCallActive(true);
    setDisplayTranscript('');
    setResponse('');
    lastProcessedTranscript.current = '';
    clearVoiceTranscript('');
    // Auto-start listening
    startListening();
  }, [startListening, clearVoiceTranscript]);

  /**
   * End voice call mode
   */
  const endVoiceCall = useCallback(() => {
    setIsVoiceCallActive(false);
    stopListening();
    cancelSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setDisplayTranscript('');
    setResponse('');
    setIsProcessing(false);
    lastProcessedTranscript.current = '';
    clearVoiceTranscript('');
  }, [stopListening, cancelSpeech, clearVoiceTranscript]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        cancelSpeech();
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
      return newMuted;
    });
  }, [cancelSpeech]);

  /**
   * Toggle listening
   */
  const toggleListen = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (!isProcessing) {
        startListening();
      }
    }
  }, [isListening, isProcessing, startListening, stopListening]);

  return {
    isVoiceCallActive,
    transcript: displayTranscript,
    response,
    isMuted,
    isListening,
    isSpeaking,
    startVoiceCall,
    endVoiceCall,
    toggleMute,
    toggleListen
  };
}

/**
 * Convert base64 to Blob
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const cleanBase64 = base64.replace(/^data:.*?;base64,/, '');
  const byteCharacters = atob(cleanBase64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}
