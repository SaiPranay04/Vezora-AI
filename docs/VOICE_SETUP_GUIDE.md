# 🎤 Voice Selection Guide

Complete guide for selecting and testing TTS voices in Vezora.

---

## ✅ Female Voice Selection

### **Quick Steps:**

1. **Launch Vezora:**
   ```bash
   npm run dev
   ```

2. **Go to Settings:**
   - Click the Settings icon in the navbar
   - Scroll to "Audio Engine" section

3. **Select a Female Voice:**
   - Open the "Voice Selection" dropdown
   - Look for voices marked with **👩** (female)
   - Choose your preferred voice

4. **Test It:**
   - Go to Chat
   - Send a message
   - AI will reply using the selected voice

---

## 🔍 Check Available Voices in Browser

### **Method 1: Browser Console**

1. Open your browser's **Developer Tools** (F12)
2. Go to the **Console** tab
3. Paste this code:

```javascript
// List all available voices
window.speechSynthesis.getVoices().forEach((voice, index) => {
    console.log(`${index + 1}. ${voice.name}`);
    console.log(`   Language: ${voice.lang}`);
    console.log(`   Gender: ${voice.name.toLowerCase().includes('female') || 
                              voice.name.toLowerCase().includes('woman') || 
                              voice.name.toLowerCase().includes('samantha') ||
                              voice.name.toLowerCase().includes('zira') ? '👩 Female' : 
                              voice.name.toLowerCase().includes('male') ||
                              voice.name.toLowerCase().includes('man') ? '👨 Male' : '🗣️ Unknown'}`);
    console.log('---');
});
```

4. Hit **Enter**

You'll see a list like:
```
1. Microsoft David - English (United States)
   Language: en-US
   Gender: 👨 Male
---
2. Microsoft Zira - English (United States)
   Language: en-US
   Gender: 👩 Female
---
```

---

### **Method 2: Test Voice Directly**

Test a specific voice in the browser console:

```javascript
// Test a female voice
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance("Hello, I'm Vezora, your AI assistant.");
const voices = synth.getVoices();

// Find a female voice (adjust the name based on your system)
const femaleVoice = voices.find(v => 
    v.name.includes('Zira') ||  // Windows
    v.name.includes('Samantha') ||  // Mac
    v.name.includes('Karen') ||  // Mac
    v.name.includes('Female')  // Generic
);

if (femaleVoice) {
    utterance.voice = femaleVoice;
    console.log(`Using voice: ${femaleVoice.name}`);
} else {
    console.log('No female voice found, using default.');
}

synth.speak(utterance);
```

---

## 🎭 Common Voice Names by OS

### **Windows 10/11:**

| Voice Name | Gender | Language |
|------------|--------|----------|
| Microsoft Zira | 👩 Female | en-US |
| Microsoft David | 👨 Male | en-US |
| Microsoft Mark | 👨 Male | en-US |
| Microsoft Hazel | 👩 Female | en-GB |

### **macOS:**

| Voice Name | Gender | Language |
|------------|--------|----------|
| Samantha | 👩 Female | en-US |
| Karen | 👩 Female | en-AU |
| Victoria | 👩 Female | en-US |
| Alex | 👨 Male | en-US |
| Fred | 👨 Male | en-US |

### **Chrome/Edge (Online voices):**

If you have **internet connection**, Chrome may provide additional Google voices:
- **Google US English Female**
- **Google UK English Female**
- **Google US English Male**

---

## 🔧 Troubleshooting

### **Problem: No voices showing in dropdown**

**Solution:**
```javascript
// Force reload voices in browser console:
window.speechSynthesis.getVoices();

// Wait 1 second, then check again:
setTimeout(() => {
    console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
}, 1000);
```

### **Problem: Voice selection reverting/not persisting**

**Solution:** ✅ **FIXED!** Voice selection now persists using localStorage.
- Selected voice is automatically saved
- Restored when you navigate between pages
- Persists across browser sessions
- No manual action needed!

### **Problem: Voice sounds robotic**

**Causes & Solutions:**

1. **System TTS quality:**
   - Browser TTS uses your OS's built-in voices
   - Windows/Linux voices tend to be more robotic
   - macOS voices are generally more natural

2. **Upgrade options:**
   - **Free:** Install better TTS voices on your OS
   - **Paid:** Add Google Cloud TTS API key (see `ENV_SETUP_GUIDE.md`)

### **Problem: Voice is too fast/slow**

**Solution:**
- Go to **Settings → Audio Engine**
- Adjust the **Voice Speed** slider (0.5x - 2.0x)

---

## 🎨 Customizing Voice Settings

### **In Settings Panel:**

You can adjust:
- **Voice Selection** - Choose male/female/accent
- **Voice Speed** - 0.5x to 2.0x
- **Auto-speak Responses** - Toggle automatic TTS

### **Programmatically (for developers):**

Edit `src/hooks/useVoice.ts` to add:
- Pitch adjustment
- Volume control
- Custom voice filters

Example:
```typescript
const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
}) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;  // 0.0 to 2.0
    utterance.volume = options?.volume || 1.0;  // 0.0 to 1.0
    synth.speak(utterance);
}, []);
```

---

## 🚀 Recommended Settings

### **For Female Voice:**

**Windows:**
```
Voice: Microsoft Zira
Speed: 1.0x
Language: en-US
```

**macOS:**
```
Voice: Samantha
Speed: 1.0x
Language: en-US
```

**Linux:**
```
Voice: English (Female) - if available
Speed: 1.2x (to compensate for slower robotic pace)
```

---

## 🌐 Advanced: Installing Better Voices

### **Windows:**

1. Go to **Settings → Time & Language → Speech**
2. Click "**Add voices**"
3. Download additional language packs
4. Restart Vezora

### **macOS:**

1. Go to **System Preferences → Accessibility → Spoken Content**
2. Click "**System Voice**" dropdown
3. Select "**Customize**"
4. Download additional voices (Samantha Enhanced, Siri voices)

### **Linux:**

Install `espeak` or `festival` for better TTS:

```bash
# Ubuntu/Debian
sudo apt install espeak espeak-ng

# Arch
sudo pacman -S espeak-ng
```

---

## 📊 Voice Quality Comparison

| Method | Quality | Latency | Cost | Internet |
|--------|---------|---------|------|----------|
| Browser TTS (Female) | ⭐⭐⭐ | Instant | Free | No |
| macOS Samantha | ⭐⭐⭐⭐ | Instant | Free | No |
| Windows Zira | ⭐⭐⭐ | Instant | Free | No |
| Google Cloud TTS | ⭐⭐⭐⭐⭐ | ~200ms | $4/1M chars | Yes |
| ElevenLabs | ⭐⭐⭐⭐⭐ | ~500ms | $22/month | Yes |

---

## 🎉 Quick Test

### **Test Female Voice Now:**

1. Open Vezora
2. Go to Settings → Audio Engine
3. Select a voice with **👩** icon
4. Go to Chat
5. Type: "Introduce yourself"
6. Hit Enter
7. Listen to the response!

---

## 💡 Tips

- **Female voices sound more natural** on macOS (Samantha)
- **Windows Zira** is decent but slightly robotic
- **Adjust speed to 1.1-1.2x** for more natural pacing
- **Use Google TTS** for professional/commercial use
- **Browser TTS is perfect** for personal/local use

---

**Back to:** [Documentation Index](README.md) | [Environment Setup](ENV_SETUP_GUIDE.md)
