import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Database, Trash2, Download, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export const PrivacyDashboard = () => {
    const [encryptionEnabled, setEncryptionEnabled] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
    const [localStorageOnly, setLocalStorageOnly] = useState(true);

    const dataStats = {
        totalMessages: 1247,
        totalMemories: 89,
        diskSpace: '45.2 MB',
        lastBackup: '2 hours ago',
        encryptionStatus: 'AES-256'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="text-green-400" size={20} />
                        Privacy & Security
                    </h3>
                    <p className="text-xs text-text/50 mt-1">Manage your data and privacy settings</p>
                </div>
                <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-medium text-green-400">
                    <Lock size={12} className="inline mr-1" />
                    Secure
                </div>
            </div>

            {/* Encryption Status */}
            <div className="p-6 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h4 className="font-semibold mb-1">End-to-End Encryption</h4>
                        <p className="text-xs text-text/60">All data is encrypted with {dataStats.encryptionStatus}</p>
                    </div>
                    <button
                        onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                            encryptionEnabled ? 'bg-green-500/20' : 'bg-white/10'
                        } relative`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                            encryptionEnabled ? 'right-1' : 'left-1'
                        }`} />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400">
                    <Shield size={14} />
                    <span>Your conversations are encrypted and stored locally</span>
                </div>
            </div>

            {/* Data Storage Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <Database size={16} className="text-primary mb-2" />
                    <div className="text-2xl font-bold">{dataStats.totalMessages}</div>
                    <p className="text-xs text-text/50">Messages Stored</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <Database size={16} className="text-secondary mb-2" />
                    <div className="text-2xl font-bold">{dataStats.diskSpace}</div>
                    <p className="text-xs text-text/50">Disk Space Used</p>
                </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text/60">Privacy Controls</h4>
                
                {[
                    {
                        icon: Eye,
                        label: 'Analytics & Telemetry',
                        description: 'Share anonymous usage data',
                        enabled: analyticsEnabled,
                        setter: setAnalyticsEnabled,
                        warning: false
                    },
                    {
                        icon: Database,
                        label: 'Local Storage Only',
                        description: 'Never sync to cloud',
                        enabled: localStorageOnly,
                        setter: setLocalStorageOnly,
                        warning: false
                    },
                    {
                        icon: Lock,
                        label: 'Secure Mode',
                        description: 'Extra encryption layer',
                        enabled: true,
                        setter: () => {},
                        warning: false
                    }
                ].map((setting, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                    >
                        <div className="flex items-start gap-3 flex-1">
                            <setting.icon size={20} className="text-text/60 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h5 className="text-sm font-medium">{setting.label}</h5>
                                    {setting.warning && (
                                        <AlertTriangle size={14} className="text-yellow-400" />
                                    )}
                                </div>
                                <p className="text-xs text-text/50 mt-0.5">{setting.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setting.setter(!setting.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                                setting.enabled ? 'bg-primary/20' : 'bg-white/10'
                            } relative shrink-0`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                                setting.enabled ? 'right-1' : 'left-1'
                            }`} />
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Data Management Actions */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-text/60">Data Management</h4>
                
                <div className="grid grid-cols-1 gap-2">
                    <button className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/30 transition-all text-left group">
                        <Download size={20} className="text-primary" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">Export Your Data</div>
                            <div className="text-xs text-text/50">Download all conversations and memories</div>
                        </div>
                        <span className="text-xs text-text/40 group-hover:text-primary">Export</span>
                    </button>

                    <button className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 transition-all text-left group">
                        <Trash2 size={20} className="text-red-400" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">Clear All Data</div>
                            <div className="text-xs text-text/50">Permanently delete all stored information</div>
                        </div>
                        <span className="text-xs text-red-400 group-hover:text-red-300">Delete</span>
                    </button>
                </div>
            </div>

            {/* Security Info */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-text/60">
                <p className="flex items-start gap-2">
                    <Shield size={14} className="text-primary mt-0.5 shrink-0" />
                    <span>
                        Your privacy is our priority. All data is encrypted using industry-standard AES-256 encryption 
                        and stored locally on your device. Vezora never sends your personal data to external servers 
                        without your explicit permission.
                    </span>
                </p>
            </div>
        </div>
    );
};
