# HWiNFO Telemetry Analyzer

Aplikasi web statis modern dan berkinerja tinggi untuk memvisualisasikan serta menganalisis file log CSV hasil rekaman dari **HWiNFO**. Dibangun dengan HTML5, Modern CSS, dan Vanilla JavaScript tanpa dependensi backend.

---

## ⚡ Fitur Utama

- **100% Client-Side & Privat**: Seluruh pemrosesan file log CSV dilakukan secara lokal di browser melalui `FileReader`. Data sensitif telemetri hardware Anda tidak pernah dikirim ke server luar.
- **Decoding Khusus HWiNFO**: Mendukung decoding `windows-1252` bawaan HWiNFO sehingga karakter derajat (`°C`), micro (`µ`), dan unit sensor tetap utuh tanpa *mojibake*.
- **Pembersihan Footer & Disambiguasi Sensor**: Otomatis mendeteksi baris footer HWiNFO (pengulangan header dan label sensor hardware), serta memberikan penamaan spesifik saat terdapat sensor dengan nama sama (contoh: CPU Package DTS vs Enhanced, Intel UHD vs NVIDIA Discrete).
- **Statistik Komprehensif per Variabel**: Setiap sensor menampilkan 4 metrik ringkasan:
  - **CURRENT**: Nilai pembacaan sensor terakhir.
  - **MINIMUM**: Nilai terendah selama periode perekaman.
  - **MAXIMUM**: Nilai puncak selama pengujian/permainan.
  - **AVERAGE**: Rata-rata matematis sepanjang sesi.
- **Dukungan Dua Bahasa (Bilingual ID / EN)**:
  - Tombol pemilih bahasa terintegrasi di navbar (`ID` / `EN`).
  - Menerjemahkan seluruh antarmuka secara instan: navigasi, dropzone, kartu bento highlights, tab kategori, matriks statistik, status boolean throttling, dan footer.
  - Pilihan bahasa tersimpan otomatis di `localStorage`.
- **Mode Gelap / Terang (Dark & Light Mode)**:
  - Default otomatis mendeteksi dan mengikuti preferensi sistem peramban/OS (`prefers-color-scheme`).
  - Dilengkapi tombol toggle pada header untuk beralih mode secara manual dan preferensi tersimpan di `localStorage`.
  - Seluruh elemen (kartu sensor, bento highlights, teks, sumbu grafik, gridlines, tooltip, dan gambar hasil ekspor PNG) otomatis beradaptasi dengan kontras optimal.
- **Visualisasi Interaktif Chart.js v4**:
  - Grafik time-series responsif dengan kurva halus, hover tooltip berstempel waktu, dan indikator batas.
  - Menggunakan `IntersectionObserver` (lazy rendering) sehingga ratusan sensor (300+ kolom) dapat dibuka tanpa membebani memori browser.
- **Bento Executive Highlights**: Panel ringkasan di bagian atas yang langsung menyajikan metrik penting:
  - Rata-rata Framerate (FPS)
  - Puncak Suhu CPU & GPU
  - Puncak Konsumsi Daya CPU (W) & GPU (W)
  - Status Thermal Throttling / Power Limit
- **Kategori & Pencarian Instan**:
  - Pengelompokan sensor pintar: *Highlights*, *Gaming & FPS*, *Temperatur*, *Beban & Usage*, *Daya & Watt*, *Frekuensi Clock*, *Voltase*, *Throttling & Limit*, dan *Semua Sensor*.
  - Live search bar dengan filter nama sensor, unit, maupun nama hardware.
- **Komparasi Multi-Variabel**:
  - Fitur overlay hingga 5 sensor pada satu grafik terpadu dengan dukungan sumbu Y ganda (*dual/multi-axis*).
- **Ekspor Grafik Resolusi Tinggi**:
  - Tombol simpan grafik per kartu maupun grafik komparasi langsung ke format gambar PNG.

---

## 🚀 Cara Menjalankan

### Opsi 1: Langsung Buka di Browser (Paling Cepat)
Cukup klik ganda atau seret file `index.html` ke peramban web modern Anda (Google Chrome, Microsoft Edge, Firefox, Brave, Opera, atau Safari):
```
./index.html
```
*Catatan:* Pada protokol `file://`, gunakan tombol **"Pilih File CSV"** untuk memilih file log yang ingin dianalisis.

### Opsi 2: Menggunakan Local Web Server
Jika Anda menggunakan Visual Studio Code, Anda dapat menggunakan ekstensi **Live Server**, atau menggunakan server bawaan Python:
```bash
cd hwinfo-analyzer
python -m http.server 8000
```
Buka peramban di alamat `http://localhost:8000/`.

---

## 📂 Struktur Direktori

```
hwinfo-analyzer/
├── .gitignore                   # Aturan pengabaian berkas lokal & data telemetri
├── index.html                   # Antarmuka web utama
├── favicon.svg                  # Ikon website (telemetry waveform badge)
├── css\
│   └── style.css                # Desain visual Ethereal Glass (Dark) & Soft Structuralism (Light)
├── js\
│   ├── app.js                   # State manager, tema & interaksi antarmuka
│   ├── i18n.js                  # Engine bilingual (Indonesian & English)
│   ├── parser.js                # Parser CSV HWiNFO, sanitasi footer & decoding windows-1252
│   ├── stats.js                 # Kalkulasi Min, Max, Average & formater unit
│   ├── categories.js            # Klasifikasi sensor otomatis & filter pencarian
│   └── charts.js                # Engine render Chart.js, tema responsif & multi-axis compare
└── README.md                    # Dokumentasi ini
```

---

## ⚙️ Panduan Logging di HWiNFO

Untuk menghasilkan file log CSV berkualitas tinggi di HWiNFO:
1. Buka HWiNFO dan pilih mode **Sensors-only**.
2. Klik ikon disket / tombol **Logging Start** di sudut kanan bawah jendela sensor.
3. Beri nama file dan simpan sebagai `.csv`.
4. Jalankan aplikasi, game, atau *benchmark* yang ingin diuji.
5. Setelah selesai, klik kembali tombol logging untuk mengakhiri pencatatan (**Logging Stop**).
6. Unggah file CSV yang dihasilkan ke **HWiNFO Telemetry Analyzer**.
