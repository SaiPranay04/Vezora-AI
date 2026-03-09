import { User, Mail, MapPin, Briefcase, Globe, Edit2, Save, Sparkles, TrendingUp, Brain, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  occupation: string;
  location: string;
  timezone: string;
  preferences: {
    voice_speed?: number;
    theme?: string;
    personality?: string;
  };
  stats: {
    total_chats: number;
    total_memories: number;
    total_tasks: number;
    account_created: string;
  };
  interests: string[];
  custom_fields: Record<string, any>;
}

export const ProfilePage = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setEditedProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!editedProfile || !token) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editedProfile)
      });
      
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const extractFromChat = async () => {
    if (!token) return;
    
    setIsExtracting(true);
    setExtractSuccess(false);
    try {
      // Get chat history from localStorage or memory
      const chatHistory = JSON.parse(localStorage.getItem('chat-history') || '[]');
      
      const response = await fetch('http://localhost:5000/api/profile/extract-from-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ chatHistory })
      });
      
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setEditedProfile(data.profile);
        setExtractSuccess(true);
        setTimeout(() => setExtractSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to extract from chat:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex-1 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
            Neural Profile
          </h1>
          <p className="text-text/60">Your personalized AI companion profile and preferences.</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={extractFromChat}
            disabled={isExtracting}
            className="flex items-center gap-2 bg-secondary/20 hover:bg-secondary/30 text-secondary px-4 py-2 rounded-xl transition-colors border border-secondary/30 disabled:opacity-50"
          >
            <Sparkles size={18} />
            {isExtracting ? 'Extracting...' : 'Extract from Chat'}
          </motion.button>
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Edit2 size={18} />
              Edit Profile
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(profile);
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </>
          )}
        </div>
      </header>

      <AnimatePresence>
        {extractSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="text-green-400" size={24} />
            <div>
              <p className="text-green-300 font-medium">Profile Updated!</p>
              <p className="text-green-400/70 text-sm">Information extracted from your chat history.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
        
        {/* Left Column - Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl overflow-hidden p-8 sticky top-8">
            {/* Avatar */}
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(142,68,255,0.4)] relative overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-1/2 translate-x-16 translate-y-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors">
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {/* Name */}
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.name || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                className="w-full text-2xl font-bold text-center bg-black/40 border border-white/10 rounded-lg px-3 py-2 mb-2 outline-none focus:border-primary transition-colors"
              />
            ) : (
              <h2 className="text-2xl font-bold text-center mb-2">{profile.name}</h2>
            )}

            {/* Bio */}
            {isEditing ? (
              <textarea
                value={editedProfile?.bio || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                className="w-full text-sm text-text/60 text-center bg-black/40 border border-white/10 rounded-lg px-3 py-2 mb-6 outline-none focus:border-primary transition-colors resize-none"
                rows={3}
              />
            ) : (
              <p className="text-sm text-text/60 text-center mb-6">{profile.bio || 'No bio yet'}</p>
            )}

            <div className="border-t border-white/5 pt-6 space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-primary" />
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile?.email || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, email: e.target.value} : null)}
                    placeholder="email@example.com"
                    className="flex-1 text-sm bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:border-primary transition-colors"
                  />
                ) : (
                  <span className="text-sm text-text/80">{profile.email || 'Not set'}</span>
                )}
              </div>

              {/* Occupation */}
              <div className="flex items-center gap-3">
                <Briefcase size={18} className="text-secondary" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.occupation || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, occupation: e.target.value} : null)}
                    placeholder="Your occupation"
                    className="flex-1 text-sm bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:border-secondary transition-colors"
                  />
                ) : (
                  <span className="text-sm text-text/80">{profile.occupation || 'Not set'}</span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-purple-400" />
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile?.location || ''}
                    onChange={(e) => setEditedProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                    placeholder="City, Country"
                    className="flex-1 text-sm bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 outline-none focus:border-purple-400 transition-colors"
                  />
                ) : (
                  <span className="text-sm text-text/80">{profile.location || 'Not set'}</span>
                )}
              </div>

              {/* Timezone */}
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-pink-400" />
                <span className="text-sm text-text/80">{profile.timezone}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Stats & Interests */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-primary" size={24} />
              Activity Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Conversations', value: profile.stats.total_chats, color: 'primary', icon: '💬' },
                { label: 'Memories', value: profile.stats.total_memories, color: 'secondary', icon: '🧠' },
                { label: 'Tasks', value: profile.stats.total_tasks, color: 'purple', icon: '✅' },
                { label: 'Days Active', value: Math.floor((Date.now() - new Date(profile.stats.account_created).getTime()) / (1000 * 60 * 60 * 24)), color: 'pink', icon: '📅' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-text/50">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Interests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Brain className="text-secondary" size={24} />
              Interests & Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interest, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-sm text-primary"
                  >
                    {interest}
                  </motion.span>
                ))
              ) : (
                <p className="text-text/50 text-sm">
                  No interests recorded yet. Chat with Vezora to build your profile!
                </p>
              )}
            </div>
            {isEditing && (
              <input
                type="text"
                placeholder="Add interests (comma-separated)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editedProfile) {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      const newInterests = value.split(',').map(i => i.trim()).filter(i => i);
                      setEditedProfile({
                        ...editedProfile,
                        interests: [...new Set([...editedProfile.interests, ...newInterests])]
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                className="w-full mt-4 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            )}
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-white/5 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="text-primary" size={24} />
              AI Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm text-text/60 mb-2 block">Voice Speed</label>
                <div className="text-lg font-semibold">{profile.preferences.voice_speed || 1.0}x</div>
              </div>
              <div>
                <label className="text-sm text-text/60 mb-2 block">Theme</label>
                <div className="text-lg font-semibold capitalize">{profile.preferences.theme || 'dark_mode'}</div>
              </div>
              <div>
                <label className="text-sm text-text/60 mb-2 block">Personality</label>
                <div className="text-lg font-semibold capitalize">{profile.preferences.personality || 'friendly'}</div>
              </div>
            </div>
            <p className="text-xs text-text/40 mt-4">
              * Preferences are synced from Settings page
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
