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
  const isMutedRef = useRef(false);
  const isVoiceCallActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const muteLockRef = useRef(false);
  const processingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isVoiceCallActiveRef.current = isVoiceCallActive;
  }, [isVoiceCallActive]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const clearWatchdog = () => {
    if (processingWatchdogRef.current) {
      clearTimeout(processingWatchdogRef.current);
      processingWatchdogRef.current = null;
    }
  };

  const stopTtsAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    cancelSpeech();
  }, [cancelSpeech]);

  const finishProcessing = useCallback(() => {
    clearWatchdog();
    isProcessingRef.current = false;
    setIsProcessing(false);
    clearVoiceTranscript('');
    lastProcessedTranscript.current = '';

    if (isVoiceCallActiveRef.current && !isMutedRef.current) {
      startListening();
    }
  }, [clearVoiceTranscript, startListening]);

  const beginProcessing = useCallback(() => {
    isProcessingRef.current = true;
    setIsProcessing(true);
    stopListening(); // critical: stop mic loop so we don't eat TTS / skip replies
    clearWatchdog();
    // Never stay stuck "processing" forever
    processingWatchdogRef.current = setTimeout(() => {
      console.warn('Voice call processing watchdog fired');
      finishProcessing();
    }, 45000);
  }, [stopListening, finishProcessing]);

  const handleSpeechRecognized = useCallback(async (recognizedText: string) => {
    const text = recognizedText.trim();
    if (!text || isMutedRef.current || isProcessingRef.current) return;
    if (!isVoiceCallActiveRef.current) return;

    beginProcessing();
    setResponse('');

    try {
      const fetchResponse = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          useContext: true,
          includeMemory: false
        })
      });

      if (!fetchResponse.ok) {
        throw new Error('Failed to get response from backend');
      }

      const data = await fetchResponse.json();

      let fullResponse = data.content || '';
      if (data.actionConfirmations?.length > 0 && data.taskAction) {
        const confirmationText = data.actionConfirmations.join('\n');
        if (!fullResponse.includes('✅') && !fullResponse.includes('📋')) {
          fullResponse = confirmationText + '\n\n' + fullResponse;
        }
      }

      setResponse(fullResponse || 'Done.');

      const speakText = data.content || fullResponse;
      if (speakText) {
        let playedPiper = false;
        try {
          const ttsResponse = await fetch(`${BACKEND_URL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: speakText })
          });

          if (ttsResponse.ok) {
            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            stopTtsAudio();
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            await new Promise<void>((resolve) => {
              const done = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
              };
              audio.onended = done;
              audio.onerror = done;
              audio.play().catch(done);
            });
            playedPiper = true;
          }
        } catch (ttsError) {
          console.error('TTS Streaming error:', ttsError);
        }

        if (!playedPiper) {
          await speak(speakText);
        }
      }
    } catch (error) {
      console.error('Voice call error:', error);
      setResponse('Sorry, I encountered an error. Please try again.');
      try {
        await speak('Sorry, I encountered an error. Please try again.');
      } catch {
        /* ignore */
      }
    } finally {
      finishProcessing();
    }
  }, [token, speak, beginProcessing, finishProcessing, stopTtsAudio]);

  useEffect(() => {
    if (!isVoiceCallActive || isMuted || isProcessing) return;
    if (!voiceTranscript?.trim()) return;
    if (voiceTranscript === lastProcessedTranscript.current) return;

    lastProcessedTranscript.current = voiceTranscript;
    setDisplayTranscript(voiceTranscript);
    handleSpeechRecognized(voiceTranscript);
  }, [voiceTranscript, isVoiceCallActive, isMuted, isProcessing, handleSpeechRecognized]);

  const startVoiceCall = useCallback(() => {
    clearWatchdog();
    setIsVoiceCallActive(true);
    isVoiceCallActiveRef.current = true;
    setIsMuted(false);
    isMutedRef.current = false;
    setDisplayTranscript('');
    setResponse('');
    setIsProcessing(false);
    isProcessingRef.current = false;
    lastProcessedTranscript.current = '';
    clearVoiceTranscript('');
    startListening();
  }, [startListening, clearVoiceTranscript]);

  const endVoiceCall = useCallback(() => {
    clearWatchdog();
    setIsVoiceCallActive(false);
    isVoiceCallActiveRef.current = false;
    stopListening();
    stopTtsAudio();
    setDisplayTranscript('');
    setResponse('');
    setIsProcessing(false);
    isProcessingRef.current = false;
    setIsMuted(false);
    isMutedRef.current = false;
    lastProcessedTranscript.current = '';
    clearVoiceTranscript('');
  }, [stopListening, stopTtsAudio, clearVoiceTranscript]);

  const toggleMute = useCallback(() => {
    if (muteLockRef.current) return;
    muteLockRef.current = true;
    setTimeout(() => {
      muteLockRef.current = false;
    }, 300);

    const nextMuted = !isMutedRef.current;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      stopListening();
      clearWatchdog();
      isProcessingRef.current = false;
      setIsProcessing(false);
    } else if (isVoiceCallActiveRef.current) {
      clearWatchdog();
      isProcessingRef.current = false;
      setIsProcessing(false);
      clearVoiceTranscript('');
      lastProcessedTranscript.current = '';
      startListening();
    }
  }, [stopListening, startListening, clearVoiceTranscript]);

  const toggleListen = useCallback(() => {
    if (isMutedRef.current) {
      isMutedRef.current = false;
      setIsMuted(false);
      isProcessingRef.current = false;
      setIsProcessing(false);
      clearVoiceTranscript('');
      lastProcessedTranscript.current = '';
      startListening();
      return;
    }

    if (isListening || isProcessingRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, clearVoiceTranscript]);

  return {
    isVoiceCallActive,
    transcript: displayTranscript,
    response,
    isMuted,
    isListening: isVoiceCallActive && !isMuted && !isProcessing && isListening,
    isSpeaking: isSpeaking || isProcessing,
    startVoiceCall,
    endVoiceCall,
    toggleMute,
    toggleListen
  };
}
