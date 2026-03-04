# UI Style Guide

Version: 1.0  
Last Updated: 2024  
Reference: VA-11 Hall-A, Eastward, World of Horror

---

## 1. Design Philosophy

### Core Concept

This game uses **layered pixel aesthetics** to reinforce narrative through visual style mutations:

- **American Dream** (Main Menu) -> Bright, warm, hopeful but fake
- **Modernization** (Shop/Bank) -> Refined, cold, efficient but alienating
- **Reality** (Bills) -> Rough, heavy, inescapable
- **Madness** (System Warning) -> Distorted, sick, breaking the fourth wall

### Font Principle

**Unified pixel font, different scenes use CSS adjustments**:

- Use the same pixel font family (Zpix + Press Start 2P)
- Distinguish scenes through font-weight, letter-spacing, font-size
- Never use sans-serif (font-sans) or serif (font-serif) fonts

---

## 2. Scene Specifications

### 2.1 Main Menu - "Pixel Paradise of American Dream"

**Visual Style**:
- **Background**: bg-sky-200 or bg-amber-100 (sky blue or warm beige)
- **Decorations**: Pixel clouds, pixel fences, pixel grass blocks
- **Atmosphere**: Like Stardew Valley's ideal town, or The Truman Show opening

**Font Specifications**:
```css
/* Title */
font-family: var(--font-pixel);
font-size: text-2xl;        /* 24px */
font-weight: bold;
letter-spacing: 0.1em;      /* Loose spacing */

/* Menu Items */
font-size: text-base;       /* 16px */
font-weight: medium;
letter-spacing: 0.05em;

/* Status Numbers */
font-size: text-sm;         /* 14px */
font-weight: bold;
```

**Animation Effects**:
- **Parallax Scrolling**: When mouse moves, foreground moves 2x faster than background
- **Cloud Floating**: Background clouds slowly move horizontally (loop)
- **Button Hover**: Slight bounce + brightened color

**Prohibited**:
- Dark backgrounds (cannot use bg-gray-900 or bg-black)
- Modern flat elements
- Border radius greater than 4px

---

### 2.2 Shop/Bank/Hospital - "Refined Pixel Modernism"

**Visual Style**:
- **Background**: bg-white or bg-gray-50 (pure white or very light gray)
- **Dividers**: 1px pixel lines (border-gray-200)
- **Cards**: Thin borders, minimal border radius (rounded-sm)
- **Atmosphere**: Like walking into Apple Store or Starbucks, clean but cold

**Font Specifications** (Key Difference):
```css
/* Key: Small, thin, compact spacing */
font-family: var(--font-pixel);
font-size: text-xs;         /* 12px */
font-weight: normal;        /* Thin weight */
letter-spacing: 0.02em;     /* Compact */
line-height: relaxed;       /* Relaxed line height for readability */

/* Titles slightly larger but remain refined */
font-size: text-sm;         /* 14px */
font-weight: medium;
```

**Readability Assurance**:
- Letter spacing cannot be too large (avoids looking like headings)
- Line height maintained at 1.6-1.8 (avoids crowding)
- Color contrast must be sufficient (dark text on light background)

**Layout Principles**:
- Plenty of whitespace (modern feel)
- Clear pixel divider lines between list items
- Icons use 16x16 or 32x32 pixel style

**Prohibited**:
- Thick black borders (too retro)
- Large border radius (breaks pixel feel)
- Shadow effects (shadow-lg, etc.)

---

### 2.3 Bills - "Pixel Printer"

**Visual Style**:
- **Background**: bg-[Fdfbf7] (beige paper color)
- **Border**: Pixel dashed line (border-dashed border-gray-400)
- **Decorations**: Corner may have pixel coffee stains
- **Atmosphere**: Like old dot matrix printer bills

**Font Specifications**:
```css
/* Dot matrix printer effect */
font-family: var(--font-pixel);
font-size: text-base;       /* 16px */
font-weight: normal;
letter-spacing: 0.2em;      /* Monospace feel, loose spacing */
text-transform: uppercase;  /* Optional: All caps looks more like printer */
```

**Animation Effects**:
- **Appearance**: Instant pop-up (0 seconds), no fade
- **Stamp**: Red pixel stamp "slaps" on (animate-stamp)
- **Sound**: If audio exists, matches printer or stamp sound

**Special Elements**:
- Bill numbers use monospace effect
- Amount numbers right-aligned
- Bottom may have pixelated signature line

---

### 2.4 System Warning - "Cthulhu Pixel Popup"

**Visual Style**:
- **Background**: bg-slate-950 or bg-purple-950 (deep purple-black)
- **Text**: text-green-400 or text-purple-400 (sick green/blood purple)
- **Border**: Irregular pixel border, may have tentacle decorations
- **Atmosphere**: Like World of Horror or Stranger Things upside down

**Font Specifications** (Key):
```css
font-family: var(--font-pixel);
font-size: text-base;
font-weight: bold;

/* Distortion effects via CSS */
animation: glitch 0.3s infinite;
filter: blur(0.3px);           /* Slight blur */
```

**Animation Effects**:
- **Text Jitter**: Slight position jitter (variant of animate-shake)
- **Glitch Effect**: Random character replacement (e.g., "确" becomes "▓" or "☒")
- **Edge Squirm**: Popup edges may have pixel tentacles slightly swaying

**Implementation Notes**:
- Just **popup overlay**, not full screen cover (keep game visible)
- Text shouldn't all become garbled, some keywords remain readable (enhances creepiness)
- Must be closable (but close button also pixelated)

**Prohibited**:
- Red (that's normal warning, not Cthulhu)
- Modern system fonts (breaks "breaking the wall" effect)

---

## 3. Button Specifications

### 3.1 Primary Button (Confirm/Buy) - "American Dream Temptation"

```css
/* Visual */
background-color: bg-yellow-400;    /* Golden yellow */
color: text-blue-900;               /* Dark blue text */
border: none;
border-radius: rounded-sm;          /* Minimal border radius */

/* Font */
font-family: var(--font-pixel);
font-weight: bold;
font-size: text-base;

/* Hover Effects */
hover: shadow-yellow-400/50;        /* Golden glow */
hover: scale-105;                   /* Slight enlargement */
```

**Feel**: Like gold coins, treasure chests, lottery wins

---

### 3.2 Danger Button (Delete/Close) - "American Warning"

```css
/* Visual */
background-color: bg-red-600;       /* Bright red */
color: text-white;                  /* White text */
border: none;
border-radius: rounded-sm;

/* Font */
font-family: var(--font-pixel);
font-weight: bold;
font-size: text-base;

/* Hover Effects */
hover: animate-shake;               /* Slight jitter */
```

**Feel**: Like stop signs, danger warnings

---

### 3.3 Disabled Button (Cannot Click) - "Cthulhu Corruption"

```css
/* Visual */
background-color: bg-gray-800;      /* Dark gray-purple */
color: text-green-900;              /* Dark green (looks like mold) */
border: border-2 border-gray-700;

/* Font - Garbled Effect */
font-family: var(--font-pixel);
font-weight: normal;

/* Special Effects */
animation: text-corrupt 2s infinite;    /* Text randomly changes to symbols */
filter: blur(0.5px);                     /* Slight blur */
```

**Garbled Symbol Set**: ▓ ▒ ░ █ ☒ ◢ ◣ ◤ ◥

**Simplified Version** (If complex animation is too difficult):
```css
/* Static garbled + color pulse */
content: "▓▓▓";                     /* Static symbols */
animation: color-pulse 1s infinite; /* Color pulses between dark green and black */
```

**Feel**: Corrupted, infected, blocked by unknown forces

---

## 4. Font Hierarchy

### Unified Base Font

```css
:root {
  --font-pixel: 'PixelFont', 'Zpix', 'Press Start 2P', monospace;
}
```

### Scene-Specific Adjustments

| Scene | Size | Weight | Letter Spacing | Special |
|-------|------|--------|----------------|---------|
| Main Menu Title | text-2xl (24px) | bold | 0.1em | - |
| Main Menu Item | text-base (16px) | medium | 0.05em | - |
| Shop/Bank | text-xs (12px) | normal | 0.02em | line-height: 1.6 |
| Bill | text-base (16px) | normal | 0.2em | uppercase |
| System Warning | text-base (16px) | bold | 0.05em | glitch animation |
| Button | text-base (16px) | bold | 0.05em | - |

---

## 5. Color System

### Background Colors

| Scene | Color Code | Description |
|-------|------------|-------------|
| Main Menu | bg-sky-200 / bg-amber-100 | American Dream bright background |
| Shop/Bank | bg-white / bg-gray-50 | Modern minimalist white |
| Bill | bg-[Fdfbf7] | Beige paper |
| System Warning | bg-slate-950 / bg-purple-950 | Cthulhu dark background |
| Overlay | bg-black/80 | Black semi-transparent overlay |

### Text Colors

| Type | Color Code | Usage |
|------|------------|-------|
| Primary Text | text-white / text-gray-900 | Main content on dark/light backgrounds |
| Secondary Text | text-gray-300 / text-gray-600 | Secondary information |
| Accent | text-blue-500 | Interactive hints |
| Danger | text-red-600 | Damage, danger, negative |
| Money | text-yellow-400 | Gold, money, temptation |
| Cthulhu | text-green-400 / text-purple-400 | Madness, system warning |

### Button Colors

| Type | Background | Text | Effect |
|------|------------|------|--------|
| Primary | bg-yellow-400 | text-blue-900 | Golden glow on hover |
| Danger | bg-red-600 | text-white | Shake on hover |
| Disabled | bg-gray-800 | text-green-900 | Corruption animation |

---

## 6. Animation System

### Core Animations

| Animation | Duration | Usage Scene | Description |
|-----------|----------|-------------|-------------|
| parallax | continuous | Main Menu | Mouse controls background movement |
| cloud-float | 20s loop | Main Menu | Background clouds slowly float |
| number-roll | 0.5s | Money change | Numbers roll like slot machine |
| instant-pop | 0s | Bill appearance | Instant appearance, no fade |
| stamp | 0.3s | Bill confirmation | Stamp "slaps" down |
| fade-in-out | 0.3s | Interface transition | Opacity change, no flashing |
| text-corrupt | 2s loop | Disabled button | Text randomly changes to symbols |
| glitch | 0.3s loop | System warning | Screen glitch effect |
| shake | 0.5s | Error feedback | Left-right shake |
| glow-pulse | 2s loop | Primary button hover | Golden glow pulses |

### Performance Requirements

**Parallax Effect**:
- Must use `transform: translate3d()` (not top/left)
- Must limit to 60fps
- Must provide settings option to turn off
- Must auto-detect low-end devices and auto-disable

**All Animations**:
- Duration must not exceed 1 second
- Must use `transform` and `opacity` ( GPU accelerated)
- Must set `will-change` for frequently animated elements

---

## 7. Component Checklist

### Core Components (Must Exist)

- [ ] TitleScreen.tsx - Main menu, American Dream style
- [ ] MiniHUD.tsx - HUD, pixel counter style
- [ ] MessageWindow.tsx - Event window
- [ ] ShopModal.tsx - Shop, refined pixel
- [ ] HospitalModal.tsx - Hospital, refined pixel
- [ ] BankModal.tsx - Bank, refined pixel
- [ ] BillOverlay.tsx - Bills, paper pixel
- [ ] SystemAlertModal.tsx - System warning, Cthulhu pixel
- [ ] ArchiveMilestoneModal.tsx - Archives, refined pixel
- [ ] InsuranceModal.tsx - Insurance, refined pixel
- [ ] DeathSummary.tsx - Death settlement

### Optional Components (Can Be Missing)

- [ ] CryptoSidebar.tsx - Cryptocurrency investment
- [ ] SystemGazeOverlay.tsx - System gaze effects
- [ ] JailOverlay.tsx - Prison system

---

## 8. Implementation Notes

### Font Loading

```html
<!-- Priority load pixel font -->
<link rel="preload" href="/fonts/zpix.woff2" as="font" type="font/woff2" crossorigin>
```

### CSS Variables

```css
:root {
  /* Font */
  --font-pixel: 'PixelFont', 'Zpix', 'Press Start 2P', monospace;
  
  /* Colors */
  --color-dream: #bae6fd;        /* sky-200 */
  --color-modern: #ffffff;       /* white */
  --color-paper: #fdfbf7;        /* beige */
  --color-cthulhu: #020617;      /* slate-950 */
  
  /* Spacing */
  --pixel-unit: 4px;
}
```

### Responsive Considerations

- Minimum resolution: 1280x720
- Recommended resolution: 1920x1080
- UI scale: 100% at 1080p, auto-adjust at other resolutions
- Mobile: Not supported (pixel fonts unreadable on small screens)

---

## 9. Quick Reference

### What You Can Use

- All Tailwind pixel units (p-2, m-4, etc.)
- Border radius: rounded-none, rounded-sm (2px)
- Borders: border, border-2, border-gray-200/600
- Pixel fonts only: var(--font-pixel)

### What You Cannot Use

- Border radius: rounded, rounded-full (destroy pixel feel)
- Shadows: shadow-lg, shadow-xl (too modern)
- Sans-serif fonts: font-sans (breaks unified style)
- Gradient backgrounds (unless specifically designed)
- Transparency: bg-opacity-50 (makes pixel fonts unclear)

---

## 10. Version History

- v1.0 - Initial version, based on VA-11 Hall-A + Eastward + World of Horror style fusion

---

**Document Maintainers**: Art Team, UI Team  
**Review Cycle**: Before each major version iteration