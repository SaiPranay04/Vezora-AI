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
        rate: 1.05,  // Optimized for natural, slightly faster speech
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US'
    });

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const synth = window.speechSynthesis;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Load available voices and restore saved voice from localStorage
    useEffect(() => {
        const loadVoices = () => {
            const voices = synth.getVoices();
            setAvailableVoices(voices);
            
            if (voices.length === 0) return; // Wait for voices to load
            
            // Try to restore saved voice from localStorage
            const savedVoiceName = localStorage.getItem('vezora_selected_voice');
            let voiceToSet: SpeechSynthesisVoice | null = null;
            
            if (savedVoiceName) {
                // Find the saved voice
                voiceToSet = voices.find(v => v.name === savedVoiceName) || null;
            }
            
            // Fallback: Find a female voice if no saved voice
            if (!voiceToSet) {
                voiceToSet = voices.find(v => 
                    v.name.toLowerCase().includes('zira') ||
                    v.name.toLowerCase().includes('hazel') ||
                    v.name.toLowerCase().includes('susan') ||
                    v.name.toLowerCase().includes('heera') ||
                    v.name.toLowerCase().includes('samantha') ||
                    v.name.toLowerCase().includes('karen') ||
                    v.name.toLowerCase().includes('female')
                ) || null;
            }
            
            // Fallback: First English voice
            if (!voiceToSet) {
                voiceToSet = voices.find(v => v.lang.startsWith('en')) || voices[0];
            }
            
            if (voiceToSet && !selectedVoice) {
                setSelectedVoice(voiceToSet);
                console.log('🎤 Voice loaded:', voiceToSet.name);
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
        setVoiceSettings(prev => {
            const newSettings = { ...prev, ...settings };
            // Save rate to localStorage
            localStorage.setItem('vezora_voice_rate', newSettings.rate.toString());
            return newSettings;
        });
    }, []);

    // Wrapper for setSelectedVoice that saves to localStorage
    const selectVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
        if (voice) {
            setSelectedVoice(voice);
            localStorage.setItem('vezora_selected_voice', voice.name);
            console.log('🎤 Voice saved:', voice.name);
        }
    }, []);

    // Load voice rate from localStorage on mount
    useEffect(() => {
        const savedRate = localStorage.getItem('vezora_voice_rate');
        if (savedRate) {
            updateVoiceSettings({ rate: parseFloat(savedRate) });
        }
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
        setSelectedVoice: selectVoice, // Use wrapper instead
        updateVoiceSettings
    };
};
