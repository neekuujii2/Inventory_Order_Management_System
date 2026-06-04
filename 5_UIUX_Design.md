# UI/UX Design Document
## Inventory & Order Management System (IMS)

**Version:** 1.0.0  
**Date:** 2025

---

## 1. Design Philosophy

**Theme:** Premium Business — Clean, structured, trustworthy. Think Bloomberg Terminal meets modern SaaS.  
**Tone:** Confident and data-forward. No decorative clutter. Every element earns its space.  
**Aesthetic:** Refined dark-accented palette with slate backgrounds, rich teal/emerald accents, and warm amber warnings. Not generic purple gradients.

---

## 2. Color Palette

```
Primary Background:   #0F172A   (Slate 900  — page background)
Surface:              #1E293B   (Slate 800  — cards, panels)
Surface Elevated:     #334155   (Slate 700  — hover states, inputs)
Border:               #475569   (Slate 600  — dividers, borders)

Accent Primary:       #0D9488   (Teal 600   — primary buttons, links, active nav)
Accent Hover:         #0F766E   (Teal 700   — hover state)
Accent Light:         #CCFBF1   (Teal 100   — badges, light bg tints)

Text Primary:         #F1F5F9   (Slate 100  — headings)
Text Secondary:       #94A3B8   (Slate 400  — labels, muted text)
Text Disabled:        #475569   (Slate 600  — placeholders)

Success:              #10B981   (Emerald 500 — stock OK, fulfilled)
Warning:              #F59E0B   (Amber 500   — low stock, pending)
Danger:               #EF4444   (Red 500     — delete, error, cancelled)
Info:                 #3B82F6   (Blue 500    — info badges)

White:                #FFFFFF
```

### CSS Variables
```css
:root {
  --bg-base:        #0F172A;
  --bg-surface:     #1E293B;
  --bg-elevated:    #334155;
  --border:         #475569;

  --accent:         #0D9488;
  --accent-hover:   #0F766E;
  --accent-light:   #CCFBF1;

  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-disabled:  #475569;

  --success:        #10B981;
  --warning:        #F59E0B;
  --danger:         #EF4444;
  --info:           #3B82F6;
}
```

---

## 3. Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Display / Logo | `"DM Serif Display"` | 400 | 28–36px |
| Headings H1 | `"Sora"` | 700 | 24px |
| Headings H2 | `"Sora"` | 600 | 20px |
| Headings H3 | `"Sora"` | 600 | 16px |
| Body / Labels | `"Inter"` | 400 | 14px |
| Body Strong | `"Inter"` | 500 | 14px |
| Caption / Meta | `"Inter"` | 400 | 12px |
| Numeric / KPI | `"JetBrains Mono"` | 600 | 28–40px |
| Code | `"JetBrains Mono"` | 400 | 13px |

**Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
```

---

## 4. Spacing System

Based on 4px grid:
```
4px   → xs   (tight internal padding)
8px   → sm
12px  → md-sm
16px  → md   (standard component padding)
20px  → md-lg
24px  → lg
32px  → xl
48px  → 2xl
64px  → 3xl
```

---

## 5. Component Design

### 5.1 Top Navigation Bar
```
┌──────────────────────────────────────────────────────────────┐
│  [IMS Logo]    Dashboard  Products  Customers  Orders        │
│                                               [status dot]   │
└──────────────────────────────────────────────────────────────┘
```
- Full-width, sticky, height: 60px
- Background: `#0F172A` with bottom border `1px solid var(--border)`
- Active link: teal underline + teal text
- Logo: DM Serif Display, white, with small teal square icon

---

### 5.2 Dashboard Layout

**Section 1 — Metric Cards (Grid, 4 columns)**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  📦 Products  │ │  👥 Customers│ │  🛒 Orders   │ │  ⚠️ Low Stock │
│     247       │ │      83      │ │     156      │ │      12       │
│  +5 this week │ │  +2 today    │ │  $18,200 val │ │  Needs restock│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```
- Card bg: `var(--bg-surface)`, rounded-xl, subtle border
- KPI number: JetBrains Mono, 36px, text-primary
- Icon: colored icon in tinted circle background
- Sub-label: text-secondary, 12px

**Section 2 — Kanban Board (Order Status Columns)**
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  ● PENDING  (12) │  │ ✓ FULFILLED (44) │  │ ✗ CANCELLED (3)  │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ Order #1042      │  │ Order #1039      │  │ Order #1031      │
│ Alice Johnson    │  │ Bob Smith        │  │ Carol White      │
│ $240.00  →       │  │ $560.00  →       │  │ $180.00  →       │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ Order #1041      │  │ Order #1038      │  │                  │
│ ...              │  │ ...              │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```
- Column header colored by status (amber/emerald/red)
- Cards: `var(--bg-elevated)`, draggable (react-beautiful-dnd)
- Click card → navigate to order detail

**Section 3 — Revenue Chart**
```
┌────────────────────────────────────────────────────────────┐
│  Revenue (Last 30 Days)                      [AreaChart]  │
│  $18,240 ────────────────────────────────────────────────  │
│                              ╭────╮                        │
│                         ╭───╯    ╰──╮                      │
│  ─────────────────╭────╯            ╰─────────────────    │
└────────────────────────────────────────────────────────────┘
```
- Recharts `AreaChart`, teal gradient fill
- X-axis: dates, Y-axis: dollar values
- Tooltip on hover showing exact day total

---

### 5.3 Feature Zigzag Section (Features Page / Landing)

```
Row 1:
┌─────────────────────┐    ┌──────────────────────┐
│  [Screenshot/Visual]│    │  Feature Title        │
│                     │    │  Description text...  │
└─────────────────────┘    └──────────────────────┘

Row 2:
┌──────────────────────┐    ┌─────────────────────┐
│  Feature Title        │    │  [Screenshot/Visual]│
│  Description text...  │    │                     │
└──────────────────────┘    └─────────────────────┘
```
- Alternating text-left / image-right, then text-right / image-left
- Smooth scroll-triggered fade-in animation
- 60/40 split layout (image wider side)
- Visual placeholder: rounded card with teal gradient + icon

---

### 5.4 Data Tables (Products, Customers, Orders)

```
┌─────────────────────────────────────────────────────────────┐
│  Products                              [+ Add Product]      │
│  [Search...]                [Filter ▼]                      │
├──────┬──────────────┬─────────┬──────────┬────────┬────────┤
│  ID  │  Name        │  SKU    │  Price   │  Stock │  Ops   │
├──────┼──────────────┼─────────┼──────────┼────────┼────────┤
│  1   │  Laptop Pro  │ LP-001  │ $1,299   │   45   │ ✏️ 🗑️  │
│  2   │  USB Hub     │ UH-102  │ $49.99   │   7 ⚠️ │ ✏️ 🗑️  │
└──────┴──────────────┴─────────┴──────────┴────────┴────────┘
```
- Striped rows: odd `var(--bg-surface)`, even `var(--bg-elevated)`
- Low stock badge: amber pill when quantity < 10
- Hover row: slight bg lift + cursor pointer
- Edit/Delete icons revealed on row hover

---

### 5.5 Forms (Modals / Drawers)

```
┌──────────────────────────────────────┐
│  Add New Product              [×]    │
├──────────────────────────────────────┤
│                                      │
│  Product Name                        │
│  ┌────────────────────────────────┐  │
│  │ e.g., Wireless Mouse           │  │
│  └────────────────────────────────┘  │
│                                      │
│  SKU / Code                          │
│  ┌────────────────────────────────┐  │
│  │ e.g., WM-001                   │  │
│  └────────────────────────────────┘  │
│                                      │
│  Price ($)         Quantity          │
│  ┌─────────────┐  ┌───────────────┐  │
│  │ 0.00        │  │ 0             │  │
│  └─────────────┘  └───────────────┘  │
│                                      │
│  [Cancel]              [Save Product]│
└──────────────────────────────────────┘
```
- Modal overlay: backdrop-blur + semi-transparent dark overlay
- Input focus: teal outline `2px solid var(--accent)`
- Error state: red border + error text below field
- Submit button: teal bg, white text, spinner on loading

---

### 5.6 Loading Skeleton

```
┌─────────────────────────────────────────────────────────────┐
│  ████████████████████████████  ← shimmer animation          │
│  ████████████████  ← 60% width                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │░░░░░░░░░░│  │░░░░░░░░░░│  │░░░░░░░░░░│  │░░░░░░░░░░│   │
│  │░░░░░░░░░░│  │░░░░░░░░░░│  │░░░░░░░░░░│  │░░░░░░░░░░│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ████████████████████████████████████████████████████████  │
│  ████████████████████████████████████████████████████████  │
│  ████████████████████████████████████████████████████████  │
└─────────────────────────────────────────────────────────────┘
```
- Shimmer: `linear-gradient` animated left-to-right
- Skeleton bg: `#334155`, shimmer: lighter `#475569`
- Mirrors actual content layout exactly
- Animation: 1.5s ease-in-out infinite

**CSS:**
```css
@keyframes shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.skeleton {
  background: linear-gradient(
    90deg, var(--bg-elevated) 25%, #475569 50%, var(--bg-elevated) 75%
  );
  background-size: 2000px 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
```

---

### 5.7 404 Page

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    4   0   4                             │
│           (large, JetBrains Mono, teal tinted)          │
│                                                          │
│           Page Not Found                                 │
│    This page doesn't exist or has been moved.           │
│    Check the URL or head back to familiar territory.    │
│                                                          │
│         [← Back to Dashboard]  [Contact Support]        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
- "404" text: 120px, JetBrains Mono, teal accent color
- Subtle grid or dot-pattern background texture
- Two CTAs: primary (teal filled) + secondary (ghost button)

---

### 5.8 Footer

```
┌──────────────────────────────────────────────────────────┐
│  [IMS]    Products · Customers · Orders · Dashboard    © 2025 IMS │
└──────────────────────────────────────────────────────────┘
```
- Single row, height: 56px
- Background: `var(--bg-surface)`, top border `1px solid var(--border)`
- Logo left, links center, copyright right
- All text: text-secondary, 13px

---

## 6. Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|-----------|-------|---------------|
| Mobile | < 640px | Stack metric cards 2×2, collapse table to cards |
| Tablet | 640–1024px | 2-col metric grid, simplified nav |
| Desktop | > 1024px | Full layout as designed |

---

## 7. Interaction & Animation Guidelines

| Interaction | Animation |
|------------|-----------|
| Page load | Staggered fade-up, 0.1s delay per section |
| Modal open | Scale from 0.95 + fade in, 200ms |
| Button hover | Slight scale-up (1.02) + color shift |
| Row hover | Bg color transition 150ms |
| Toast notifications | Slide in from top-right, auto-dismiss 3s |
| Delete confirmation | Shake animation on "confirm" step |
| Chart load | Draw animation from left to right |
| Kanban drag | Card lifts with shadow + rotation 1-2deg |

---

## 8. Status Badge Colors

| Status | Color | Style |
|--------|-------|-------|
| Pending | `#F59E0B` | Amber pill, amber bg/10 |
| Fulfilled | `#10B981` | Emerald pill |
| Cancelled | `#EF4444` | Red pill |
| Low Stock | `#F59E0B` | Amber with ⚠️ icon |
| In Stock | `#10B981` | Emerald dot |

---

*End of UI/UX Design Document*
