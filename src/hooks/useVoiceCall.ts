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
   * Handle recognized speech — send to backend and speak response
   */
  const handleSpeechRecognized = useCallback(async (recognizedText: string) => {
    if (!recognizedText.trim()) return;
    
    setIsProcessing(true);
    stopListening(); // Stop listening while processing
    setResponse(''); // Clear previous response

    try {
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
      
      // Build the display response — include task action confirmations
      let fullResponse = data.content || '';
      if (data.actionConfirmations && data.actionConfirmations.length > 0 && data.taskAction) {
        const confirmationText = data.actionConfirmations.join('\n');
        if (!fullResponse.includes('✅') && !fullResponse.includes('📋')) {
          fullResponse = confirmationText + '\n\n' + fullResponse;
        }
      }
      
      setResponse(fullResponse);

      // Speak the response (use original content for cleaner TTS)
      if (!isMuted && data.content) {
        speak(data.content);
      }

      // Restart listening after speech completes
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
      
      setResponse('Sorry, I encountered an error. Please try again.');
      if (!isMuted) speak('Sorry, I encountered an error. Please try again.');

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
  }, [isMuted, isVoiceCallActive, speak, stopListening, startListening, clearVoiceTranscript, token]);

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

