# Design System — Yuzu Africa Content Hub

## 1. Visual World & Brand Identity
Built strictly from the **Yuzu Africa Brand Bible (v1.0)** in a **Minimalist Bright-Mode** aesthetic:
- **Brand Name**: Always written `Yuzu Africa`
- **Master Logo**: `/yuzu-logo.jpg` (`Yuzu africa brand logo.jpg`), minimum 24px height, placed on clean white/off-white surfaces.
- **Theme**: Strictly **Bright Mode** (`#FAF7F2` Off-white 60% background, `#FFFFFF` crisp white cards, `#222222` Charcoal body text).

## 2. Color Tokens
| Token | Hex | Role |
|---|---|---|
| `--yuzu-offwhite` | `#FAF7F2` | Main app background (60% ratio) |
| `--yuzu-surface` | `#FFFFFF` | Cards, calendar container, drawers |
| `--yuzu-purple` | `#5B2A86` | Primary brand colour, headlines, active day & tab state (20% ratio) |
| `--yuzu-magenta` | `#D6246E` | Primary accent, CTAs (`Send Update`, `Add Post`), notification badges |
| `--yuzu-orange` | `#F58220` | Secondary accent, pending review badges |
| `--yuzu-yellow` | `#FFC20E` | Spark/zest icon highlight on dark purple pills (never text on white) |
| `--yuzu-charcoal` | `#222222` | High-contrast body text |

## 3. Typography
- **Headlines & Subheadings**: `Poppins` (`600` SemiBold, `700` Bold)
- **Body & Controls**: `Inter` / `Poppins` (`400` Regular, `500` Medium)

## 4. Layout & Viewport Architecture
- **Desktop / Mobile Toggle**: Instant top-bar switch that transitions the workspace between a responsive 12-column Desktop grid and a framed `412px` Mobile Phone viewport.
- **Three-Step Drill-Down**:
  1. **Month Calendar**: Highlights days that contain scheduled content with soft purple tint (`#F6F0FC`) and platform dots.
  2. **Selected Day Socials**: Lists all social platforms scheduled for that day with status pills (`Approved` vs `Pending`).
  3. **Content Preview & Action**: Displays caption, Hugging Face Dataset file preview/link, Admin approval toggle + commentary + `Send Update`, and Manager upload/edit form.
