# Project Rules & Architecture: WhatsApp HD Status PWA ("PureStatus Alternative")

## 1. Project Overview
A lightning-fast, privacy-centric Progressive Web App (PWA) designed to optimize and split videos for WhatsApp Status without quality loss, avoiding WhatsApp's aggressive destructive server-side recompression.

## 2. Core Philosophy & Quality Standards
- **Boss Directive (Zero Micro-Management):** "Aku boss, aku nak minimum kerja aku, aku nak fully automation kau dan team kau buat semua, kecuali urgent kena approval aku je." The agent squad operates autonomously end-to-end (sourcing files, reverse engineering, full PWA development, automated testing, and deployment prep).
- **Zero Cloud Processing Cost:** All video transcoding and 30-second chunking MUST execute client-side via `@ffmpeg/ffmpeg` (WebAssembly). No raw user video files are ever sent to a server.
- **Speed & Simplicity:** The user interface must be clean, uncluttered, and take no more than 3 taps to optimize and download a video.
- **Design Aesthetic:** Premium dark mode (OLED black / Zinc-950), subtle glassmorphism borders (`border-white/10`), vibrant emerald/teal accents for action buttons, and responsive touch controls for mobile.
- **Cross-Platform Compatibility:** Must run smoothly on both iOS (Safari PWA) and Android (Chrome PWA).

## 3. Video Transcoding Standard (WhatsApp Sweet-Spot)
- **Container:** MP4 (`-movflags +faststart`)
- **Video Codec:** H.264 (`libx264`), Profile: High, Level: 4.0
- **Framerate:** 30 fps (drop 60 fps to prevent WhatsApp panic-transcoding)
- **Target Resolution:** Max 1080x1920 (vertical 9:16) or 720x1280 depending on device capability
- **Rate Factor:** CRF 20–22 (Preset: `medium` / `fast` for client-side balance)
- **Audio:** AAC, 128 kbps, 44.1 kHz, stereo
- **Chunking:** Auto-slice into contiguous 30.0-second segments

## 4. Monetization & Access Control
- **Free Trial:** 7 days stored locally and verified against device identity / Supabase.
- **Pricing:** RM9/month.
- **Verification:** Simple activation key / DuitNow QR verification modal.
