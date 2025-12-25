# Design System Reference

## Overview

This document defines the visual design system for the Xandeum Analytics Platform. The system uses a strict semantic color palette (4-5 colors maximum) to create a calm, intentional, and professional infrastructure dashboard interface.

## Color System

### Semantic Color Roles

The design system uses **exactly 4-5 semantic colors**. No gradients, no glow effects, no additional accent colors.

#### Primary / Accent

- **Hue**: Blue (217°)
- **Light mode**: `#3b82f6` (hsl(217, 91%, 59%))
  - Higher saturation, lower luminance for light mode
  - Usage: Selected tabs, active buttons, progress bars, reachable state indicators
- **Dark mode**: `#60a5fa` (hsl(217, 96%, 70%))
  - Same hue identity, adjusted luminance for dark mode
  - Passes WCAG contrast requirements on dark surfaces
  - Usage: Selected tabs, active buttons, progress bars, reachable state indicators

**Rules:**

- ONE blue hue used everywhere
- No secondary blues
- Primary and Accent use the same color (semantic role distinction only)

#### Danger

- **Hue**: Red (0°)
- **Light mode**: `#dc2626` (hsl(0, 73%, 50%))
  - Toned down saturation for light mode
  - Usage: Private/unreachable state, errors, failed counts
- **Dark mode**: `#f87171` (hsl(0, 90%, 71%))
  - Same hue identity, adjusted for dark mode
  - Usage: Private/unreachable state, errors, failed counts

#### Muted

- **Light mode**: `#f4f4f5` (neutral gray background)
  - Usage: Backgrounds, dividers
- **Dark mode**: `#27272a` (cool gray background)
  - Cool gray with low contrast
  - Usage: Backgrounds, dividers

#### Muted Foreground

- **Light mode**: `#71717a` (neutral gray text)
  - Neutral gray (not blue-gray)
  - Usage: Labels, secondary text, "N/A" states, placeholders
- **Dark mode**: `#a1a1aa` (cool gray text)
  - Cool gray with low contrast
  - Usage: Labels, secondary text, "N/A" states, placeholders

#### Surface

- **Light mode**: `#ffffff` (white)
  - Off-white with subtle borders
  - Usage: Card backgrounds, panels, page background
- **Dark mode**: `#0f0f12` (near-black)
  - Base: near-black
  - Cards slightly elevated from background
  - Usage: Card backgrounds, panels, page background

#### Border

- **Light mode**: `#e4e4e7` (neutral gray border)
  - Subtle neutral gray
  - Usage: Card borders, dividers, input borders
- **Dark mode**: `#3f3f46` (cool gray border)
  - Cool gray
  - Usage: Card borders, dividers, input borders

### Color Tiles

#### Primary / Accent

```
Light: #3b82f6  Dark: #60a5fa
████████████████████████████████
████████████████████████████████
████████████████████████████████
████████████████████████████████
```

#### Danger

```
Light: #dc2626  Dark: #f87171
████████████████████████████████
████████████████████████████████
████████████████████████████████
████████████████████████████████
```

#### Muted

```
Light: #f4f4f5  Dark: #27272a
████████████████████████████████
████████████████████████████████
████████████████████████████████
████████████████████████████████
```

#### Muted Foreground

```
Light: #71717a  Dark: #a1a1aa
████████████████████████████████
████████████████████████████████
████████████████████████████████
████████████████████████████████
```

#### Surface

```
Light: #ffffff  Dark: #0f0f12
████████████████████████████████
████████████████████████████████
████████████████████████████████
████████████████████████████████
```

### Color Application Rules

1. **Active states** → Primary
2. **Reachable state** → Accent (outline only)
3. **Private/Error states** → Danger (outline only)
4. **Inactive states** → Muted
5. **Never use more than 4-5 colors at once**
6. **Same hue identity across dark/light, adjust luminance only**

## Typography

### Scale

#### Titles / Headings

- **Size**: `text-md` (16px)
- **Weight**: `font-semibold`
- **Usage**: Page headers, section titles

#### Primary Metrics (Credits)

- **Size**: `text-2xl` (24px)
- **Weight**: `font-bold`
- **Color**: `text-foreground`
- **Usage**: Credits value (most prominent metric, always first)

#### Secondary Metrics

- **Size**: `text-lg` (18px)
- **Weight**: `font-semibold`
- **Color**: `text-foreground`
- **Usage**: CPU, RAM, Uptime, Throughput values

#### Labels

- **Size**: `text-[11px]` (11px)
- **Weight**: `font-medium`
- **Style**: `uppercase tracking-wide`
- **Color**: `text-muted-foreground`
- **Usage**: Metric labels (CREDITS, CPU, RAM, etc.)

#### Body Text

- **Size**: `text-xs` (12px)
- **Weight**: `font-normal`
- **Color**: `text-muted-foreground` or `text-foreground`
- **Usage**: Secondary information, descriptions

#### Monospace

- **Font**: `font-mono`
- **Usage**: Addresses, pubkeys, numeric values in status

### Typography Rules

1. Credits always use the largest size (`text-2xl`)
2. Other metrics use consistent secondary size (`text-lg`)
3. Labels are always uppercase with wide tracking
4. Missing data uses `text-muted-foreground` (not opacity variants)

## Spacing

### Card Padding

- **Standard**: `p-4` (16px)
- **Consistent across all cards**

### Vertical Spacing

- **Between metric groups**: `gap-4` (16px)
- **Between metrics in grid**: `gap-4` (16px)
- **Between label and value**: `gap-1.5` (6px)

### Layout Structure

- **Preserve structure**: Layout structure is maintained even when data is missing
- **No collapsing**: Sections never collapse, use muted placeholders instead
- **Equal spacing**: Spacing remains consistent whether metrics are present or missing

## Badges

### Reachable Badge

- **Style**: Outline only
- **Border**: `border-primary`
- **Icon color**: `text-primary`
- **Background**: Transparent
- **Size**: `h-6 w-6` (24px × 24px)
- **Icon**: Globe (`w-3 h-3`, `strokeWidth={1.5}`)
- **Appearance**: Same in dark and light mode (semantic color adapts)

### Private/Unreachable Badge

- **Style**: Outline only
- **Border**: `border-danger`
- **Icon color**: `text-danger`
- **Background**: Transparent
- **Size**: `h-6 w-6` (24px × 24px)
- **Icon**: Lock (`w-3 h-3`, `strokeWidth={1.5}`)
- **Appearance**: Same in dark and light mode (semantic color adapts)

### Badge Rules

1. Always outline style (never filled)
2. Icon + border carry color, text stays neutral
3. Do not visually overpower node identity
4. Maintain equal size across all cards
5. Same appearance in dark and light mode (colors adapt)

## Dividers

### Style

- **Type**: Solid border (not dashed)
- **Color**: `border-muted-foreground/20` (20% opacity)
- **Usage**: Between metric groups

### Rules

1. Visible but subtle
2. Use Muted color with opacity
3. Never disappear between cards with missing data
4. Consistent opacity across all dividers

## Icons

### Sizes

- **Small**: `w-3 h-3` (12px) - Used in badges, inline icons
- **Standard**: `w-4 h-4` (16px) - Used in buttons, controls

### Stroke Weight

- **Standard**: `strokeWidth={1.5}` - Applied consistently across all icons

### Icon Colors

- **Accent**: Primary color for reachable/informational icons
- **Danger**: Danger color for private/error icons
- **Muted**: Muted foreground for secondary actions

### Icon Rules

1. All icons use the same stroke weight (1.5)
2. Icon sizes are consistent across the app
3. Icons follow semantic color rules
4. Icons adapt correctly in both themes
5. No decorative colors

## Components

### MetricStat Component

#### Structure

- Label (uppercase, muted)
- Value (size varies by importance)
- Progress bar (optional)

#### Credits (Highlighted)

- Label: `text-[11px] uppercase tracking-wide text-muted-foreground`
- Value: `text-2xl font-bold text-foreground`
- No progress bar
- Always appears first in metric flow
- Full width layout

#### Secondary Metrics

- Label: `text-[11px] uppercase tracking-wide text-muted-foreground`
- Value: `text-lg font-semibold text-foreground`
- Progress bar: `h-1.5 bg-muted` with `bg-primary` fill

### Status Strip

#### Format

Sentence-style formatting:

- "Last ingestion: {success} succeeded · {failed} failed · {skipped} skipped"

#### Color Usage

- **Success**: `text-foreground` (primary text color)
- **Failed**: `text-danger` (only critical part colored)
- **Skipped**: `text-muted-foreground` (muted)
- **Separator**: `·` (middle dot)

#### Rules

- Use sentence-style formatting
- Color only the critical parts (failures)
- Success/skipped use muted/primary
- No timers (moved to header)
- Works in both dark and light mode

### Missing Data States

#### Rules

1. Use `text-muted-foreground` (not opacity variants)
2. "N/A" or "Idle" should look deliberate, not accidental
3. Dividers remain visible but lighter
4. Never remove entire sections just because data is missing
5. Preserve layout structure

## Layout Hierarchy

### Card Structure

1. **Address / Identity** - Node address, pubkey, version
2. **Credits** (primary metric) - Full width, largest size, first position
3. **Separator** - Muted divider
4. **State/Capacity** (CPU, RAM) - Grid 2 columns
5. **Separator** - Muted divider
6. **Behavior/Activity** (Uptime, Throughput) - Grid 2 columns

### Visual Hierarchy

- Credits visually dominates (largest size, first position)
- CPU/RAM/Uptime/Throughput are visually secondary
- Credits always appears first in the metric flow
- "N/A" states use muted styling but keep layout intact

## Example Card Anatomy

```
┌─────────────────────────────────────┐
│ Address: 192.168.1.1:6000      [🌐] │
│ pubkey: abc123...              [📋] │
│ version: 1.2.3...              [📋] │
│ Last seen: 2h ago                    │
├─────────────────────────────────────┤
│ CREDITS                               │
│ 22.5k                                 │
├─────────────────────────────────────┤
│ CPU          RAM                      │
│ 45.2%        0.82 GB                   │
│ [████████░░] [██████░░░░]            │
├─────────────────────────────────────┤
│ UPTIME        THROUGHPUT              │
│ 40h 33m       125.4 KB/s              │
└─────────────────────────────────────┘
```

## Implementation Notes

### CSS Variables

All colors are defined as CSS variables in `globals.css`:

- `--primary`
- `--danger`
- `--muted`
- `--muted-foreground`
- `--surface`
- `--border`

### Tailwind Classes

Use semantic Tailwind classes:

- `text-primary`, `bg-primary`, `border-primary`
- `text-danger`, `bg-danger`, `border-danger`
- `text-muted-foreground`, `bg-muted`
- `text-foreground` (primary text color)
- `border-border` (borders)

### No Custom Tokens

- Do NOT introduce Tailwind token files
- Use CSS variables and semantic classes only

## Constraints

1. **No animations**: Subtle transitions only (already implemented)
2. **No new UI features**: This is a refactor, not feature addition
3. **No data logic changes**: Visual only
4. **Limited color palette**: 4-5 semantic colors maximum
5. **Consistent spacing**: Preserve structure, normalize rhythm
6. **No gradients**: Solid colors only
7. **No glow effects**: Flat design only

## Goals

After this refactor, the UI should:

- **Never show more than 4-5 colors at once**
- **Feel designed in both dark and light mode** (not inverted)
- **Look calm, intentional, and infra-grade**
- **Maintain visual discipline** with limited, coherent visual vocabulary
