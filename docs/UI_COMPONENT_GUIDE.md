# Vezora UI Component Guide 🎨

Quick reference for all enhanced UI components and their states.

---

## 🎤 VoiceButton States

### Idle State
```
Visual: Pulsing dual rings around button
Color: Primary purple glow
Animation: Slow scale pulse (3s cycle)
Icon: Static microphone
```

### Listening State
```
Visual: Expanded glow with bright rings
Color: Primary purple (intense)
Background: Gradient from primary to purple-600
Animation: Icon scale pulse (1.2s cycle)
Border: 2px primary with animated shadow
```

### Speaking State
```
Visual: 5-bar waveform animation
Color: Secondary cyan glow
Background: Gradient from secondary to secondary-80
Animation: Bars oscillating at different delays
Border: 2px secondary with cyan shadow
```

---

## 💬 Chat Message Types

### User Message
```
Position: Right-aligned
Background: #1F1B2E (dark purple-tinted)
Border: Primary/20 (subtle purple)
Corner: Rounded-tr-none (speech bubble effect)
Icon: User icon in primary/20 circle
Layout: Flex-row-reverse (icon on right)
```

### Assistant Message
```
Position: Left-aligned
Background: #121C2E (dark blue-tinted)
Border: White/5
Corner: Rounded-tl-none
Icon: Bot icon in secondary/20 circle
Shadow: Purple glow on hover
Extra: Replay button (appears on hover)
```

### Typing Indicator
```
Visual: 3 animated dots
Colors: Secondary/50
Animation: Bounce with staggered delays (0ms, 150ms, 300ms)
Container: Same style as assistant message
```

---

## 🧠 Memory Card States

### Default Card
```
Background: Gradient from #1A1A1A to #151515
Border: White/5
Padding: 20px
Corner Radius: 16px (2xl)
```

### Hover Card
```
Border: Primary/50 (purple glow)
Shadow: 0 0 30px primary/40
Scale: 1.02
Buttons: Edit/Delete icons fade in
```

### Confidence Badges
```
High:   Green-500/10 bg, Green-400 text, Green-500/20 border
Medium: Yellow-500/10 bg, Yellow-400 text, Yellow-500/20 border
Low:    Orange-500/10 bg, Orange-400 text, Orange-500/20 border
Icon:   Shield (10px)
```

---

## ⚙️ Settings Components

### Theme Cards (4 options)
```
Dark Glow:  Purple/Blue gradient, Moon icon
Midnight:   Gray/Black gradient, Moon icon
Neon:       Pink/Cyan gradient, Sparkles icon
Light:      White/Gray gradient, Sun icon

Active State: Primary border, glow shadow, animated dot indicator
Inactive:     White/10 border, white/5 background
Size:         Full width in 2-column grid
```

### Personality Cards (4 options)
```
Friendly:     😊 emoji, warm description
Professional: 💼 emoji, formal description
Sassy:        😎 emoji, playful description
Concise:      ⚡ emoji, brief description

Active State: Secondary border, cyan/10 bg, "Active" badge
Layout:       Vertical stack with full width
```

### Toggle Switches
```
Enabled:  Primary/20 bg, primary dot (right position)
Disabled: White/10 bg, white/50 dot (left position)
Size:     12px height × 6px width
Hover:    Increased brightness
```

---

## 🧭 NavRail Items

### Brand Logo (Top)
```
Size: 40px × 40px
Background: Gradient from primary to secondary
Content: "V" letter
Animation: Pulsing glow, rotation on hover
Position: Top center, 40px margin below
```

### Nav Button States
```
Inactive:
  Icon: Text/40 (low opacity)
  Background: Transparent
  Hover: Text/80, white/5 bg, scale 1.05

Active:
  Icon: Primary color with glow shadow
  Background: White/10 + gradient overlay
  Indicator: 1px gradient line on left edge
  Animation: Icon pulse (2s cycle)
```

### Nav Tooltips
```
Trigger: Hover (2s delay)
Position: Left side, 16px offset
Style: Black/90 bg, white/10 border, backdrop blur
Arrow: Small triangle on left edge
Animation: Slide-in from left
```

---

## 🔮 Mini-Mode Orb

### Visual Design
```
Size: 80px × 80px
Background: Gradient primary → purple-600 → secondary
Border: 2px white/20
Shadow: Animated 10-60px primary glow
Position: Fixed bottom-right (32px margin)
```

### Animations
```
Float: -8px vertical movement (3s cycle)
Rotate: Inner gradient 360° (8s cycle)
Hover: Scale 1.1 + rotation wobble
Particles: 6 particles on hover (radial burst)
```

### Status Indicator
```
Dot: 16px circle, green-400, top-right corner
Border: 2px background color
Animation: Scale pulse + glow (2s cycle)
```

---

## 🚀 Splash Screen Elements

### Main Logo Circle
```
Size: 128px × 128px
Background: Gradient primary → purple-600 → secondary
Border: 4px white/20
Inner: Rotating gradient layer (6s)
Orbits: 3 white dots circling perimeter (3s each)
```

### Progress Bar
```
Container: 256px × 4px, white/10
Fill: Gradient primary → secondary → primary
Animation: Slide left-to-right (2s cycle, infinite)
Width: 50% of container
```

### Status Messages
```
Icon: Rotating CPU (2s)
Text: "Initializing AI Core..."
Dots: Animated opacity fade (1.5s cycle)
Color: Text/50 (muted)
Font: Monospace for tech feel
```

---

## 🎨 Color Reference

### Primary Colors
```css
--primary:    #8E44FF  /* Vibrant Purple */
--secondary:  #5ED0F3  /* Cyan Blue */
--background: #0D0D0D  /* Deep Black */
--text:       #F5F5F7  /* Off-white */
--glow:       #E3DFFD  /* Lavender Highlight */
```

### Semantic Colors
```css
--bubble-user: #1F1B2E  /* Purple-tinted dark */
--bubble-ai:   #121C2E  /* Blue-tinted dark */
--success:     #4ADE80  /* Green-400 */
--warning:     #FACC15  /* Yellow-400 */
--error:       #F87171  /* Red-400 */
```

### Opacity Levels
```
High emphasis:    100% (white)
Medium emphasis:  80%  (white/80)
Low emphasis:     60%  (white/60)
Disabled:         40%  (white/40)
Borders:          5-20% (white/5 to white/20)
Backgrounds:      5-10% (white/5 to white/10)
```

---

## ⚡ Animation Timing

### Duration Standards
```
Micro:     150ms  (hover, focus)
Quick:     300ms  (page transitions, toggles)
Standard:  500ms  (modals, panels)
Slow:      800ms  (splash, large movements)
Ambient:   2-4s   (background glows, pulses)
```

### Easing Functions
```
easeOut:     Fast start, slow end (UI entry)
easeInOut:   Smooth both ends (transitions)
easeIn:      Slow start, fast end (UI exit)
linear:      Constant speed (rotations, loops)
spring:      Bouncy (emphasis, delight)
```

---

## 📐 Spacing System

### Margins & Padding
```
xs:  4px   (0.5 in Tailwind)
sm:  8px   (2)
md:  16px  (4)
lg:  24px  (6)
xl:  32px  (8)
2xl: 48px  (12)
```

### Border Radius
```
sm:   4px   (rounded-sm)
md:   8px   (rounded-md)
lg:   12px  (rounded-lg)
xl:   16px  (rounded-xl)
2xl:  24px  (rounded-2xl)
full: 9999px (rounded-full - circles)
```

---

## 🎭 Component States Priority

### Interaction Hierarchy
```
1. Tap/Click    → Scale 0.95
2. Hover        → Scale 1.05, brightness increase
3. Focus        → Border glow (primary/50)
4. Active       → Background glow, indicator
5. Disabled     → Opacity 40%, cursor not-allowed
6. Loading      → Animated spinner/dots
```

---

## 💡 Design Patterns Used

### Glassmorphism
- Backdrop blur (backdrop-blur-xl)
- Semi-transparent backgrounds (white/5 to white/20)
- Subtle borders (white/10)

### Neumorphism
- Soft shadows
- Gradient backgrounds
- Subtle depth layers

### Fluid Animation
- Continuous motion (ambient)
- Spring physics (interactions)
- Staggered timing (lists)

### Contextual Color
- Primary for AI/system
- Secondary for user/input
- Semantic for status (green/yellow/red)

---

**Quick Tip:** All measurements use Tailwind's spacing scale.
Multiply the number by 4 to get pixels (e.g., `p-6` = 24px).

---

**Last Updated:** January 2026
