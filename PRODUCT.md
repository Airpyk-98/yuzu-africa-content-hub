# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
delegated: Vite + React + Tailwind CSS deployed on Firebase Hosting + Cloud Firestore + Firebase Auth, with Hugging Face Datasets for persistent media storage.

## Users
1. **Admin (`admin@yuzuafrica.com`)**: Digital Marketing Lead / Founder at Yuzu Africa. Reviews daily scheduled content across social channels, leaves short commentary, toggles approval on/off, clicks Send to notify managers in real-time, and approves or deactivates Account Manager accounts. Also can update password in Profile Settings.
2. **Account Managers (default: Ikechukwu Paul Ebiringa, `ebiringai@gmail.com`)**: Social Media Managing Interns and Account Managers. Plan and upload daily posts across Instagram, TikTok, LinkedIn, X, Facebook, and WhatsApp Business by choosing the post type, uploading media files (persisted directly to Hugging Face Dataset), adding post links, or inputting caption text, and receiving real-time approval updates and notification badge counts.

## Product Purpose
A minimalist, bright-mode content calendar and approval workspace for Yuzu Africa. It replaces static PDF calendars with a real-time calendar where days with scheduled content are highlighted, clicking a day reveals the social channels scheduled for that day, and clicking a social channel opens the post preview for instant commentary, approval, or uploading.

## Positioning
A zero-clutter, instant-sync social media calendar built specifically around Yuzu Africa's multi-channel workflow—featuring instant Desktop/Mobile viewport toggling, direct Hugging Face Dataset persistent media storage, and one-click day-to-social-to-review drill-down.

## Operating Context
Used daily (Mon–Fri, 8:00 am – 5:00 pm WAT and during campaigns) by Yuzu Africa's remote marketing team in Nigeria. Built around the November 2026 Content Calendar (`Yuzu_Africa_Nov2026_Social_Media_Calendar_Final.pdf`) across 6 channels: Instagram, TikTok, LinkedIn, X, Facebook, and WhatsApp Business.

## Capabilities and Constraints
- **Desktop / Mobile View Toggle**: Instant top-bar toggle switching between full Desktop layout and a framed Mobile Phone viewport preview.
- **Default Accounts**:
  - Admin: `admin@yuzuafrica.com` / `Admin321`
  - Default Manager: `ebiringai@gmail.com` / `Airpyk98` (Name: `Ikechukwu Paul Ebiringa`, pre-approved, credited as the author of the preloaded November 2026 calendar posts).
- **Password Visibility & Profile Settings**: Eye icon to preview passwords on Sign In, Sign Up, and Change Password screens. Admin and managers can change their password in Profile Settings.
- **Minimalist Calendar Home**: Shows the month and calendar grid. Days with content display a distinct brand color indicator. Clicking a day shows the list of socials with content for that day. Clicking a social previews the content, where Admin can add commentary or toggle Approve and hit Send, or Managers can upload/edit posts (select post kind, upload file to Hugging Face Dataset, paste post link, or input text).
- **Team Management**: Admin can approve newly signed-up Account Manager accounts or deactivate/reactivate them.
- **Real-Time Sync & Notifications**: All changes sync live via Cloud Firestore (`onSnapshot`), with unread notification badge counts for updates by any manager or admin.
- **Simplicity & Copy**: Simple, intuitive, minimalist UI. Avoid excess text or complex words.

## Brand Commitments
- **Name**: Always written `Yuzu Africa` (two words, capital Y and A).
- **Logo**: Official Yuzu Africa logo (`Yuzu africa brand logo.jpg`) on light backgrounds, minimum 24px height, clear space respected.
- **Bright Mode Only**: Strictly bright mode (`#FAF7F2` Off-white and `#FFFFFF` White as 60% main backgrounds, `#222222` Charcoal body text). Never dark mode.
- **Brand Palette**:
  - Purple: `#5B2A86` (Primary brand colour, headlines, active states)
  - Magenta: `#D6246E` (Primary accent, key highlights, buttons)
  - Orange: `#F58220` (Secondary accent, energy, callouts)
  - Yellow: `#FFC20E` (Highlight, icons, small "zest" accents — never yellow or orange text on white)
  - Off-white: `#FAF7F2` (Main background)
  - Charcoal: `#222222` (Body text)
- **Typography**: `Poppins` (Bold/SemiBold for headlines/subheadings) and `Inter` or `Poppins` (Regular/Medium for body).

## Evidence on Hand
- `Yuzu Africa Brand Bible.pdf.pdf`: Brand identity, colors, typography, content pillars, and platform rules.
- `Yuzu africa brand logo.jpg`: Master brand logo mark and wordmark.
- `Yuzu_Africa_Nov2026_Social_Media_Calendar_Final.pdf`: Full November 2026 schedule across Instagram, TikTok, LinkedIn, X, Facebook, and WhatsApp Business.
- `Yuzu Africa - Offer Letter - Social Media Managing Intern.pdf`: Role context and KPIs for Ikechukwu Paul Ebiringa.

## Product Principles
1. **Minimalist & Obvious**: Every screen has one clear purpose with short labels and zero filler text.
2. **Three-Tap Flow**: Month Calendar → Day's Socials → Post Preview & Action (Approve/Comment or Upload).
3. **True Bright-Mode Brand Craft**: Warm off-white (`#FAF7F2`), crisp white cards, deep Yuzu Purple (`#5B2A86`), and vibrant Magenta (`#D6246E`) accents.
4. **Instant Real-Time Feedback**: Actions by Admin or Managers reflect immediately with live notification badges.
