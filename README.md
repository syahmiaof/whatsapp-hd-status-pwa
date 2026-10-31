<div align="center">
  <h1>whatsapp-hd-status-pwa</h1>
  <p><strong>StatusHD — Privacy-First Client-Side WebAssembly Video Optimizer & Splitter for WhatsApp Status</strong></p>
  <p>
    <a href="https://statushd.syahmiaof.my"><img src="https://img.shields.io/badge/Demo-Live-60E1B5?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="Demo"></a>
    <a href="https://github.com/syahmiaof/whatsapp-hd-status-pwa"><img src="https://img.shields.io/badge/Source-GitHub-60E1B5?style=for-the-badge&logo=github&logoColor=60E1B5&labelColor=101713" alt="GitHub"></a>
    <a href="https://github.com/syahmiaof/whatsapp-hd-status-pwa/actions"><img src="https://img.shields.io/badge/CI-Passing-60E1B5?style=for-the-badge&logo=githubactions&logoColor=60E1B5&labelColor=101713" alt="CI"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-All_Rights_Reserved-60E1B5?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="License"></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-19.0-101713?style=for-the-badge&logo=react&logoColor=60E1B5" alt="React">
    <img src="https://img.shields.io/badge/Vite-6.0-101713?style=for-the-badge&logo=vite&logoColor=60E1B5" alt="Vite">
    <img src="https://img.shields.io/badge/TypeScript-5.7-101713?style=for-the-badge&logo=typescript&logoColor=60E1B5" alt="TypeScript">
    <img src="https://img.shields.io/badge/FFmpeg-WASM-101713?style=for-the-badge&logo=ffmpeg&logoColor=60E1B5" alt="FFmpeg WASM">
    <img src="https://img.shields.io/badge/PWA-Enabled-101713?style=for-the-badge&logo=pwa&logoColor=60E1B5" alt="PWA">
    <img src="https://img.shields.io/badge/TailwindCSS-3.4-101713?style=for-the-badge&logo=tailwindcss&logoColor=60E1B5" alt="TailwindCSS">
  </p>
</div>

---

<div align="center">
  <img src="public/og-preview.jpg" alt="Preview StatusHD WebAssembly Application" width="100%">
</div>

---

## 📌 Problem & Architectural Innovation

When users post 4K or 60fps high-framerate mobile video to WhatsApp Status, WhatsApp's ingest servers apply aggressive, lossy recompression algorithms that introduce heavy artifacting, color banding, and frame jitter.

**StatusHD** (`statushd.syahmiaof.my`) solves this by running an on-device WebAssembly transcode engine that pre-conditions source footage to WhatsApp's exact playback sweet spot. By outputting compliant H.264 streams and contiguous 30.0-second segments, WhatsApp bypasses destructive server-side recompression and serves the video in crisp, native HD quality.

### Key Value Pillars:
- **Functionality**: 100% on-device client-side video transcoding, automated 30-second story chunking, fast start MP4 atom optimization, and audio channel resampling.
- **Aesthetic Excellence**: Clean, utilitarian dark UI built with Tailwind CSS, reactive real-time progress indicators, and intuitive mobile ergonomics.
- **Business Impact**: Complete zero-server infrastructure cost and zero privacy liability. The user's video never leaves their device, delivering total privacy and unlimited horizontal scalability.

---

## ⚙️ Client-Side WebAssembly Transcode Pipeline

This application runs `@ffmpeg/ffmpeg` compiled to WebAssembly inside the browser:
- **🔒 Zero Cloud Ingestion**: Absolute privacy. Processing occurs entirely within local browser memory via Web Workers.
- **Optimized Video Profile**:
  - **Container**: MP4 with `-movflags +faststart` for instantaneous playback.
  - **Codec**: H.264 (`libx264`), Profile High, Level 4.0.
  - **Framerate**: Standardized to 30.0 fps (prevents WhatsApp 60fps panic re-encoding).
  - **Resolution Target**: Adaptive scaling to 1080×1920 (9:16 vertical) or 720×1280 based on hardware capability.
  - **Tuning**: Constant Rate Factor (CRF 20–22) with `preset fast` for fast client throughput.
  - **Sequential Story Slicing**: Splits long clips into seamless 30.0-second fragments ready for direct status upload.

---

## 📱 Progressive Web App (PWA) Capabilities

- **Offline Transcoding**: Service worker powered by `vite-plugin-pwa` caches the WebAssembly runtime and core assets for fully offline execution.
- **Native Installation**: Installable directly on iOS (Safari Share &rarr; Add to Home Screen) and Android (Chrome in-app install prompt) as a standalone mobile utility.

---

## 🚀 Live Production & Infrastructure

- **Live Production URL**: [https://statushd.syahmiaof.my](https://statushd.syahmiaof.my)
- **Deployment Platform**: Vercel Edge Network on `main` branch
- **Continuous Validation**: Automated GitHub Actions CI workflow executing strict TypeScript validation and production bundle verification.

---

## 📄 License & Intellectual Property

Proprietary Software. Copyright &copy; 2026 Muhammad Syahmi (`syahmiaof`). All rights reserved.  
Created solely for demonstration and portfolio showcase purposes. See [LICENSE](LICENSE) for details.
