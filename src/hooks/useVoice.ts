import { useState, useCallback, useEffect, useRef } from 'react';

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
        rate: 1.05,
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US'
    });

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    /** Mic loop enabled (hands-free). Set false while processing a reply. */
    const shouldListenRef = useRef(false);
    const startingRef = useRef(false);
    const interimRef = useRef('');
    const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const synth = window.speechSynthesis;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const clearRestartTimer = () => {
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }
    };

    useEffect(() => {
        const loadVoices = () => {
            const voices = synth.getVoices();
            setAvailableVoices(voices);
            if (voices.length === 0) return;

            const savedVoiceName = localStorage.getItem('vezora_selected_voice');
            let voiceToSet: SpeechSynthesisVoice | null = null;

            if (savedVoiceName) {
                voiceToSet = voices.find(v => v.name === savedVoiceName) || null;
            }
            if (!voiceToSet) {
                voiceToSet = voices.find(v =>
                    /zira|hazel|susan|heera|samantha|karen|female/i.test(v.name)
                ) || null;
            }
            if (!voiceToSet) {
                voiceToSet = voices.find(v => v.lang.startsWith('en')) || voices[0];
            }
            if (voiceToSet && !selectedVoice) {
                setSelectedVoice(voiceToSet);
            }
        };

        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }, [synth]);

    const tryStartRecognition = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition || !shouldListenRef.current || startingRef.current) return;

        startingRef.current = true;
        interimRef.current = '';
        try {
            recognition.start();
            setIsListening(true);
        } catch (e: any) {
            if (e?.name === 'InvalidStateError' || String(e?.message || '').includes('already started')) {
                setIsListening(true);
            } else {
                console.error('Mic start failed', e);
                setIsListening(false);
            }
        } finally {
            setTimeout(() => {
                startingRef.current = false;
            }, 200);
        }
    }, []);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = voiceSettings.lang;

        recognition.onresult = (event: any) => {
            let finalChunk = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const piece = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalChunk += piece;
                } else {
                    interimRef.current = piece;
                }
            }
            if (finalChunk.trim()) {
                interimRef.current = '';
                setTranscript(finalChunk.trim());
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            startingRef.current = false;

            // If browser never marked a final result, commit last interim so we still respond
            if (interimRef.current.trim()) {
                const leftover = interimRef.current.trim();
                interimRef.current = '';
                setTranscript(leftover);
            }

            // Only auto-restart when still armed (not while processing a reply)
            clearRestartTimer();
            if (shouldListenRef.current) {
                restartTimerRef.current = setTimeout(() => {
                    tryStartRecognition();
                }, 300);
            }
        };

        recognition.onerror = (event: any) => {
            const err = event?.error;
            if (err !== 'no-speech' && err !== 'aborted') {
                console.error('Speech recognition error', err);
            }
            setIsListening(false);
            startingRef.current = false;
            clearRestartTimer();

            // Don't hammer restart on no-speech — wait a bit longer
            if (shouldListenRef.current && err !== 'not-allowed' && err !== 'service-not-allowed') {
                const delay = err === 'no-speech' ? 500 : 400;
                restartTimerRef.current = setTimeout(() => tryStartRecognition(), delay);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            shouldListenRef.current = false;
            clearRestartTimer();
            try {
                recognition.abort();
            } catch {
                /* ignore */
            }
        };
    }, [voiceSettings.lang, tryStartRecognition]);

    const startListening = useCallback(() => {
        shouldListenRef.current = true;
        clearRestartTimer();
        tryStartRecognition();
    }, [tryStartRecognition]);

    /** Stop mic and cancel pending auto-restarts (call while waiting for AI reply). */
    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        startingRef.current = false;
        clearRestartTimer();
        if (!recognitionRef.current) {
            setIsListening(false);
            return;
        }
        try {
            recognitionRef.current.stop();
        } catch {
            /* ignore */
        }
        setIsListening(false);
    }, []);

    const speak = useCallback((text: string, options?: Partial<typeof voiceSettings>) => {
        return new Promise<void>((resolve) => {
            if (utteranceRef.current) {
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

            const done = () => {
                setIsSpeaking(false);
                resolve();
            };

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = done;
            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e);
                done();
            };

            utteranceRef.current = utterance;
            synth.speak(utterance);

            // Safety: some browsers stall onend
            setTimeout(() => {
                if (utteranceRef.current === utterance) done();
            }, Math.min(30000, Math.max(4000, text.length * 80)));
        });
    }, [synth, selectedVoice, voiceSettings]);

    const cancelSpeech = useCallback(() => {
        synth.cancel();
        setIsSpeaking(false);
        utteranceRef.current = null;
    }, [synth]);

    const pauseSpeech = useCallback(() => {
        if (isSpeaking) synth.pause();
    }, [synth, isSpeaking]);

    const resumeSpeech = useCallback(() => {
        if (isSpeaking) synth.resume();
    }, [synth, isSpeaking]);

    const updateVoiceSettings = useCallback((settings: Partial<typeof voiceSettings>) => {
        setVoiceSettings(prev => {
            const newSettings = { ...prev, ...settings };
            localStorage.setItem('vezora_voice_rate', newSettings.rate.toString());
            return newSettings;
        });
    }, []);

    const selectVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
        if (voice) {
            setSelectedVoice(voice);
            localStorage.setItem('vezora_selected_voice', voice.name);
        }
    }, []);

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
        setSelectedVoice: selectVoice,
        updateVoiceSettings
    };
};
