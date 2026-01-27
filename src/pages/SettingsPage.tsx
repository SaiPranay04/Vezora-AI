import { Volume2, Monitor, Cpu } from 'lucide-react';

export const SettingsPage = () => {
    return (
        <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
            <header className="mb-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                    System Configuration
                </h1>
                <p className="text-text/60">Customize your Vezora interface and behavioral parameters.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">

                {/* Visual Interface */}
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Monitor className="text-primary" size={20} /> Interface
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">Appearance Mode</div>
                                <div className="text-xs text-text/50">Midnight Hologram is active</div>
                            </div>
                            <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm">
                                <option>Midnight Hologram</option>
                                <option>Cyberpunk Neon</option>
                                <option>Minimalist White</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">UI Scaling</div>
                                <div className="text-xs text-text/50">Adjust component density</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 rounded-md bg-white/10 text-xs">Compact</button>
                                <button className="px-3 py-1 rounded-md bg-primary text-white text-xs">Normal</button>
                                <button className="px-3 py-1 rounded-md bg-white/10 text-xs">Large</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audio Engine */}
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Volume2 className="text-secondary" size={20} /> Audio Engine
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm">Speech Rate</span>
                                <span className="text-xs font-mono text-text/50">1.0x</span>
                            </div>
                            <input type="range" className="w-full accent-secondary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm">Pitch Variance</span>
                                <span className="text-xs font-mono text-text/50">High</span>
                            </div>
                            <input type="range" className="w-full accent-secondary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Core Logic */}
                <div className="col-span-full bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Cpu className="text-red-400" size={20} /> Neural Permissions
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'File System Access', desc: 'Read/Write access to user documents', active: true },
                            { label: 'Application Launcher', desc: 'Permission to start external processes', active: true },
                            { label: 'Network Access', desc: 'Allow Gemini Pro web searches', active: true },
                        ].map((perm, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 border border-white/5 rounded-xl bg-black/20">
                                <div className={`mt-1 w-10 h-6 ${perm.active ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full relative transition-colors`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm bg-white transition-all ${perm.active ? 'left-5' : 'left-1'}`} />
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{perm.label}</div>
                                    <div className="text-xs text-text/50 leading-tight mt-1">{perm.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
