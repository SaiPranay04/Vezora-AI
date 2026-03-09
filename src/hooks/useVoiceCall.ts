/**
 * Voice Call Hook - Manage voice call mode interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoice } from './useVoice';
import { useAuth } from '../contexts/AuthContext';

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
  const { token } = useAuth();
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

      // Use main /api/chat endpoint (includes coordinator + task creation)
      const fetchResponse = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: recognizedText }],
          useContext: true,
          includeMemory: false
        })
      });

      if (!fetchResponse.ok) {
        throw new Error('Failed to get response from backend');
      }

      const data = await fetchResponse.json();
      const fullResponse = data.content || '';
      setResponse(fullResponse);

      // Speak the response
      if (!isMuted && fullResponse) {
        speak(fullResponse);
      }

      // Restart listening after speech
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
      
      // Fallback retry
      try {
        const fallbackResponse = await fetch(`${BACKEND_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: recognizedText }],
            useContext: true,
            includeMemory: false
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
