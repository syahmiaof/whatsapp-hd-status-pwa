<div align="center">
  <h1>StatusHD</h1>
  <p><strong>Sediakan video untuk WhatsApp Status terus dalam browser.</strong></p>
  <p><a href="https://statushd.syahmiaof.my/">Buka laman</a> · <a href="https://syahmiaof.my/projects">Portfolio</a></p>
</div>

![Preview StatusHD](public/og-preview.jpg)

StatusHD ialah PWA frontend untuk memilih video, mengkod semula ke MP4 H.264 dan memotongnya kepada segmen sekitar 30 saat. Pemprosesan menggunakan FFmpeg WebAssembly pada peranti pengguna; tiada backend muat naik video dalam kod aplikasi ini.

## Apa yang tersedia

- Pilih video dan semak maklumat fail sebelum proses.
- Pilih had resolusi 1080p atau 720p, auto-split 30 saat dan pilihan senyapkan audio.
- Lihat progress, preview klip, kemudian simpan satu klip atau semua klip.
- Cuba Web Share jika browser menyokong fail; muat turun fail menjadi laluan alternatif.
- Antara muka responsif dan aset PWA untuk pemasangan pada peranti yang menyokongnya.

## Jalankan secara lokal

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Untuk smoke test video, jalankan production preview pada `http://127.0.0.1:4173`, pasang Playwright Chromium serta FFmpeg dan ffprobe pada sistem, kemudian:

```bash
npm run test:smoke
```

Skrip itu menjana video ujian, memprosesnya dalam Chromium dan memeriksa fail output. Perintah di atas ialah cara menjalankan semakan; README ini tidak mendakwa keputusan ujian terkini.

## Struktur

- `src/App.tsx` — aliran pilih, proses, batalkan dan simpan video.
- `src/lib/ffmpegEngine.ts` — transcoding dan pembahagian klip dalam browser.
- `src/components/` — dropzone, tetapan, progress dan hasil.
- `scratch/test_ui_flow.cjs` — smoke test output video.

## Had

WhatsApp boleh memampatkan semula video selepas dimuat naik. Web Share tidak boleh memilih “My Status” secara automatik atau mengesahkan status benar-benar dipos; pengguna perlu menyemak dan menerbitkan sendiri dalam WhatsApp. Prestasi bergantung pada browser, RAM dan saiz video.

## Builder

[Muhammad Syahmi](https://syahmiaof.my)
