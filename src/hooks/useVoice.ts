import { useState, useCallback, useEffect, useRef } from 'react';

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: any) => void;
    onend: () => void;
    onerror: (event: any) => void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [voiceSettings, setVoiceSettings] = useState({
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US'
    });

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const synth = window.speechSynthesis;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = synth.getVoices();
            setAvailableVoices(voices);
            // Default to first English voice or first available
            const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            if (defaultVoice && !selectedVoice) {
                setSelectedVoice(defaultVoice);
            }
        };

        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }, [synth]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false; // Stop after one sentence for command-like feel
            recognition.interimResults = true;
            recognition.lang = voiceSettings.lang;

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setTranscript(event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                // You could expose interim transcript if needed for "typing" effect
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [voiceSettings.lang]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                // Clear previous transcript
                setTranscript('');
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error("Mic start failed", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const speak = useCallback((text: string, options?: Partial<typeof voiceSettings>) => {
        if (isSpeaking && utteranceRef.current) {
            synth.cancel();
        }

        const settings = { ...voiceSettings, ...options };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = settings.volume;
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.lang = settings.lang;
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            setIsSpeaking(false);
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
    }, [isSpeaking, synth, selectedVoice, voiceSettings]);

    const cancelSpeech = useCallback(() => {
        synth.cancel();
        setIsSpeaking(false);
        utteranceRef.current = null;
    }, [synth]);

    const pauseSpeech = useCallback(() => {
        if (isSpeaking) {
            synth.pause();
        }
    }, [synth, isSpeaking]);

    const resumeSpeech = useCallback(() => {
        if (isSpeaking) {
            synth.resume();
        }
    }, [synth, isSpeaking]);

    const updateVoiceSettings = useCallback((settings: Partial<typeof voiceSettings>) => {
        setVoiceSettings(prev => ({ ...prev, ...settings }));
    }, []);

    return {
        isListening,
        isSpeaking,
        transcript,
        availableVoices,
        selectedVoice,
        voiceSettings,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
        pauseSpeech,
        resumeSpeech,
        setTranscript,
        setSelectedVoice,
        updateVoiceSettings
    };
};
