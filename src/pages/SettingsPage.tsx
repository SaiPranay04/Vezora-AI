import { Volume2, Palette, Sparkles, Globe, Shield, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVoice } from '../hooks/useVoice';

export const SettingsPage = () => {
    const [theme, setTheme] = useState('dark-glow');
    const [personality, setPersonality] = useState('friendly');
    const [language, setLanguage] = useState('en');
    const { 
        availableVoices, 
        selectedVoice, 
        setSelectedVoice,
        voiceSettings,
        updateVoiceSettings,
        speak,
        isSpeaking
    } = useVoice();

    // Load saved tone on mount
    useEffect(() => {
        const savedTone = localStorage.getItem('vezora_voice_tone');
        if (savedTone) {
            setPersonality(savedTone);
        }
    }, []);

    const testVoice = () => {
        speak("Hello! I'm Vezora, your AI assistant. This is how I sound with the current voice settings.");
    };

    return (
        <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
            <header className="mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                    System Configuration
                </h1>
                <p className="text-text/60">Customize your Vezora interface and behavioral parameters.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">

                {/* Theme Selector */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
                >
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Palette className="text-primary" size={20} /> Theme
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="text-sm font-medium mb-3 block">Appearance Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'dark-glow', name: 'Dark Glow', icon: Moon, gradient: 'from-purple-500/20 to-blue-500/20' },
                                    { id: 'midnight', name: 'Midnight', icon: Moon, gradient: 'from-gray-800/20 to-black/20' },
                                    { id: 'neon', name: 'Neon', icon: Sparkles, gradient: 'from-pink-500/20 to-cyan-500/20' },
                                    { id: 'light', name: 'Light', icon: Sun, gradient: 'from-white/20 to-gray-100/20' }
                                ].map(themeOption => (
                                    <motion.button
                                        key={themeOption.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setTheme(themeOption.id)}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${
                                            theme === themeOption.id 
                                                ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(142,68,255,0.3)]' 
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${themeOption.gradient} opacity-50`} />
                                        <div className="relative flex flex-col items-center gap-2">
                                            <themeOption.icon size={20} />
                                            <span className="text-xs font-medium">{themeOption.name}</span>
                                        </div>
                                        {theme === themeOption.id && (
                                            <motion.div
                                                layoutId="theme-selected"
                                                className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(142,68,255,0.8)]"
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div>
                                <div className="text-sm font-medium">Reduce Motion</div>
                                <div className="text-xs text-text/50">Minimize animations</div>
                            </div>
                            <button className="w-12 h-6 bg-white/10 rounded-full relative transition-colors hover:bg-white/20">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white/50 rounded-full shadow-sm transition-all" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Personality Selector */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-secondary/30 transition-all"
                >
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Sparkles className="text-secondary" size={20} /> Personality
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="text-sm font-medium mb-3 block">AI Response Style</label>
                            <div className="space-y-2">
                                {[
                                    { id: 'friendly', name: 'Friendly', desc: 'Warm, casual, and slightly playful', emoji: '😊' },
                                    { id: 'professional', name: 'Professional', desc: 'Concise, neutral, task-focused', emoji: '💼' },
                                    { id: 'calm', name: 'Calm', desc: 'Slow, reassuring with minimal emotion', emoji: '🧘' },
                                    { id: 'sassy', name: 'Sassy', desc: 'Confident, witty, very short replies', emoji: '😎' }
                                ].map(pers => (
                                    <motion.button
                                        key={pers.id}
                                        whileHover={{ x: 4 }}
                                        onClick={() => {
                                            setPersonality(pers.id);
                                            localStorage.setItem('vezora_voice_tone', pers.id);
                                            // Save to backend
                                            fetch('http://localhost:5000/api/settings', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ voiceTone: pers.id })
                                            }).catch(e => console.error('Failed to save tone:', e));
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                                            personality === pers.id 
                                                ? 'border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(94,208,243,0.2)]' 
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{pers.emoji}</span>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium flex items-center gap-2">
                                                    {pers.name}
                                                    {personality === pers.id && (
                                                        <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">Active</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-text/50 mt-0.5">{pers.desc}</div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Audio Engine */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-secondary/30 transition-all"
                >
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Volume2 className="text-secondary" size={20} /> Audio Engine
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="flex justify-between mb-3">
                                <span className="text-sm font-medium">Voice Speed</span>
                                <motion.span 
                                    key={voiceSettings.rate}
                                    initial={{ scale: 1.2, color: '#5ED0F3' }}
                                    animate={{ scale: 1, color: '#A0A0A0' }}
                                    className="text-xs font-mono text-text/50 px-2 py-1 bg-secondary/10 rounded"
                                >
                                    {voiceSettings.rate.toFixed(1)}x
                                </motion.span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="2.0" 
                                step="0.1"
                                value={voiceSettings.rate}
                                onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                                className="w-full accent-secondary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer hover:accent-secondary/80"
                            />
                            <div className="flex justify-between text-[10px] text-text/40 mt-1">
                                <span>Slower</span>
                                <span>Faster</span>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Voice Selection
                                {selectedVoice && (
                                    <span className="ml-2 text-[10px] text-text/50">
                                        ({selectedVoice.lang})
                                    </span>
                                )}
                            </label>
                            <select 
                                value={selectedVoice?.name || ''}
                                onChange={(e) => {
                                    const voice = availableVoices.find(v => v.name === e.target.value);
                                    if (voice) setSelectedVoice(voice);
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-secondary transition-colors"
                            >
                                {availableVoices.length === 0 && (
                                    <option>Loading voices...</option>
                                )}
                                {/* Female Voices First */}
                                {availableVoices.filter(v => {
                                    const name = v.name.toLowerCase();
                                    return name.includes('female') || 
                                           name.includes('woman') ||
                                           name.includes('zira') ||
                                           name.includes('hazel') ||
                                           name.includes('susan') ||
                                           name.includes('heera') ||
                                           name.includes('samantha') ||
                                           name.includes('karen') ||
                                           name.includes('victoria') ||
                                           name.includes('natasha') ||
                                           name.includes('salli') ||
                                           name.includes('joanna');
                                }).map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        👩 {voice.name}
                                    </option>
                                ))}
                                {/* Male Voices */}
                                {availableVoices.filter(v => {
                                    const name = v.name.toLowerCase();
                                    return (name.includes('male') || 
                                            name.includes('man') ||
                                            name.includes('david') ||
                                            name.includes('mark') ||
                                            name.includes('george') ||
                                            name.includes('ravi') ||
                                            name.includes('alex') ||
                                            name.includes('fred')) &&
                                           !name.includes('female');
                                }).map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        👨 {voice.name}
                                    </option>
                                ))}
                                {/* All Other Voices */}
                                {availableVoices.filter(v => {
                                    const name = v.name.toLowerCase();
                                    const isFemale = name.includes('female') || name.includes('woman') ||
                                                    name.includes('zira') || name.includes('hazel') ||
                                                    name.includes('susan') || name.includes('heera') ||
                                                    name.includes('samantha') || name.includes('karen') ||
                                                    name.includes('victoria') || name.includes('natasha') ||
                                                    name.includes('salli') || name.includes('joanna');
                                    const isMale = (name.includes('male') || name.includes('man') ||
                                                   name.includes('david') || name.includes('mark') ||
                                                   name.includes('george') || name.includes('ravi') ||
                                                   name.includes('alex') || name.includes('fred')) &&
                                                   !name.includes('female');
                                    return !isFemale && !isMale;
                                }).map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        🗣️ {voice.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-[10px] text-text/40">
                                    👩 = Female • 👨 = Male • 🗣️ = Other
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={testVoice}
                                    disabled={isSpeaking}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                                        isSpeaking 
                                            ? 'bg-secondary/30 text-secondary/50 cursor-not-allowed' 
                                            : 'bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/30'
                                    }`}
                                >
                                    {isSpeaking ? '🎤 Speaking...' : '🎤 Test Voice'}
                                </motion.button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div>
                                <div className="text-sm font-medium">Auto-speak Responses</div>
                                <div className="text-xs text-text/50">Read replies aloud</div>
                            </div>
                            <button className="w-12 h-6 bg-secondary/20 rounded-full relative transition-colors hover:bg-secondary/30">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-secondary rounded-full shadow-sm shadow-secondary/50 transition-all" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Language Settings */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
                >
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Globe className="text-primary" size={20} /> Language
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Interface Language</label>
                            <select 
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                            >
                                <option value="en">🇺🇸 English (US)</option>
                                <option value="en-gb">🇬🇧 English (UK)</option>
                                <option value="es">🇪🇸 Spanish</option>
                                <option value="fr">🇫🇷 French</option>
                                <option value="de">🇩🇪 German</option>
                                <option value="ja">🇯🇵 Japanese</option>
                                <option value="zh">🇨🇳 Chinese</option>
                                <option value="hi">🇮🇳 Hindi</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium mb-2 block">Time Format</label>
                            <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary text-sm font-medium">
                                    12-hour
                                </button>
                                <button className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text/60 text-sm hover:bg-white/10">
                                    24-hour
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div>
                                <div className="text-sm font-medium">Auto-translate</div>
                                <div className="text-xs text-text/50">Detect and translate</div>
                            </div>
                            <button className="w-12 h-6 bg-primary/20 rounded-full relative transition-colors hover:bg-primary/30">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-sm shadow-primary/50 transition-all" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Privacy & Permissions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="col-span-full bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl overflow-hidden hover:border-red-400/30 transition-all"
                >
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Shield className="text-red-400" size={20} /> Privacy & Permissions
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'File System Access', desc: 'Read/Write access to user documents', active: true, color: 'green' },
                            { label: 'Application Launcher', desc: 'Permission to start external processes', active: true, color: 'green' },
                            { label: 'Network Access', desc: 'Allow web searches and API calls', active: true, color: 'yellow' },
                            { label: 'Microphone', desc: 'Voice input and commands', active: true, color: 'green' },
                            { label: 'Screen Recording', desc: 'Context awareness from screen', active: false, color: 'red' },
                            { label: 'Location Services', desc: 'Local time and weather data', active: false, color: 'red' },
                        ].map((perm, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.35 + i * 0.05 }}
                                className="group flex items-start gap-4 p-4 border border-white/5 rounded-xl bg-black/20 hover:bg-black/30 hover:border-white/10 transition-all cursor-pointer"
                            >
                                <button className={`mt-1 w-12 h-6 ${perm.active ? 'bg-green-500/20' : 'bg-white/10'} rounded-full relative transition-all group-hover:scale-105`}>
                                    <motion.div 
                                        className={`absolute top-1 w-4 h-4 rounded-full shadow-lg transition-all ${
                                            perm.active 
                                                ? 'bg-green-400 left-6 shadow-green-400/50' 
                                                : 'bg-white/50 left-1'
                                        }`}
                                        whileHover={{ scale: 1.1 }}
                                    />
                                </button>
                                <div className="flex-1">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        {perm.label}
                                        {perm.active && (
                                            <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                Enabled
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-text/50 leading-tight mt-1">{perm.desc}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
};
