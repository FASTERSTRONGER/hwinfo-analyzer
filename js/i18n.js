/**
 * Internationalization (i18n) Module
 * Supports bilingual switching (Indonesian and English) with persistent preference.
 */

(function (window) {
  'use strict';

  const I18n = {
    currentLang: 'id',

    translations: {
      id: {
        // Navbar
        brandTitle: 'HWiNFO Analyzer',
        brandTag: 'Majidtech Telemetry Suite',
        navCompare: 'Komparasi',
        navChangeFile: 'Ganti File',
        navSessionActive: 'Sesi Aktif',
        sessionSamples: '{count} sampel',
        themeToggleTitle: 'Ganti Tema (Gelap/Terang)',
        langToggleTitle: 'Ganti Bahasa (ID / EN)',

        // Hero & Upload
        heroEyebrow: 'Engine Telemetri Presisi Tinggi',
        heroTitle: 'Visualisasi & Analisis Log HWiNFO',
        heroSubtitle: 'Buka log CSV HWiNFO untuk menganalisis ratusan sensor hardware, grafik responsif per variabel, statistik Min/Max/Average, dan deteksi limit suhu.',
        dropHeading: 'Tarik & Letakkan File CSV HWiNFO di Sini',
        dropSubtext: 'Mendukung format ekspor HWiNFO standar (Date, Time, Sensor Units, encoding windows-1252)',
        btnSelectFile: 'Pilih File CSV',
        alertInvalidCsv: 'Silakan pilih file dengan ekstensi .csv hasil export dari HWiNFO.',
        readingFile: 'Membaca {name} (windows-1252)...',
        calculatingStats: 'Menghitung statistik Min, Max, Average...',

        // Bento Highlights
        bentoFpsLabel: 'Rata-rata Framerate',
        bentoFpsInactive: 'Sensor FPS tidak aktif',
        bentoCpuTempLabel: 'Puncak Suhu CPU',
        bentoGpuTempLabel: 'Puncak Suhu GPU',
        bentoCpuPowerLabel: 'Puncak Daya CPU Package',
        bentoGpuPowerLabel: 'Puncak Daya GPU',
        bentoThrottleLabel: 'Status Throttling',
        bentoAvgPrefix: 'Rata-rata:',
        bentoDetected: 'Terdeteksi',
        bentoNormal: 'Normal',
        bentoFlagsTriggered: 'flag limit terpicu',
        bentoNoThrottling: 'Bebas Thermal Throttling',

        // Category Tabs
        catHighlights: 'Highlights',
        catGaming: 'Gaming & FPS',
        catTemperatures: 'Temperatur',
        catUsage: 'Beban & Usage',
        catPower: 'Daya & Watt',
        catClocks: 'Frekuensi Clock',
        catVoltage: 'Voltase',
        catThrottling: 'Throttling & Limit',
        catAll: 'Semua Sensor',
        tabsScrollPrev: 'Scroll kategori ke kiri',
        tabsScrollNext: 'Scroll kategori ke kanan',

        // Search & Controls
        searchPlaceholder: 'Cari sensor (e.g. CPU, Temp, FPS)...',
        showingVariables: 'Menampilkan {count} variabel',
        noVariablesTitle: 'Tidak ada variabel yang cocok',
        noVariablesSub: 'Coba kata kunci pencarian lain atau pilih tab kategori berbeda.',

        // Cards & Stats
        statCurrent: 'CURRENT',
        statMin: 'MINIMUM',
        statMax: 'MAXIMUM',
        statAvg: 'AVERAGE',
        statLastStatus: 'STATUS TERAKHIR',
        statSessionActivity: 'AKTIVITAS SESI',
        statTriggered: 'Terpicu ({count}x, {pct}%)',
        statNeverTriggered: 'Normal (Tidak Pernah)',
        btnExportPng: 'Export PNG',
        btnAddCompare: '+ Komparasi',
        btnInCompare: 'Tersimpan di Komparasi',
        sensorEyebrowFallback: 'SENSOR TELEMETRI',

        // Comparison Modal
        modalTitle: 'Komparasi Multi-Variabel',
        modalDesc: 'Pilih hingga 5 variabel untuk dioverlay secara tersinkronisasi pada sumbu multi-aksis.',
        btnExportComparePng: 'Export PNG Komparasi',
        modalCloseLabel: 'Tutup Modal',
        alertMaxCompare: 'Maksimum 5 variabel untuk komparasi bersamaan.',

        // Footer
        footerBrandTitle: 'HWiNFO Analyzer',
        footerBrandSubtitle: 'Majidtech Telemetry Suite',
        footerDesc: 'Visualisasi dan analisis log telemetri hardware presisi tinggi berbasis peramban web. Memproses ratusan sensor time-series secara instan, aman, dan tanpa ketergantungan server luar.',
        footerHeadingPrivacy: 'Privasi & Eksekusi',
        footerHeadingTech: 'Teknologi & Engine',
        footerHeadingCompat: 'Kompatibilitas',
        footerTagClientSide: '100% Client-Side',
        footerTagZeroIngestion: 'Zero Server Ingestion',
        footerTagFileReader: 'Local FileReader API',
        footerTagDecoder: 'Windows-1252 ANSI Decoder',
        footerTagChartjs: 'Chart.js v4 (Canvas 60fps)',
        footerTagPapaparse: 'PapaParse (Streaming Parser)',
        footerTagObserver: 'IntersectionObserver Lazy Load',
        footerTagMultiaxis: 'Multi-Axis Synchronized Scaling',
        footerTagHwinfoVersions: 'HWiNFO v6 / v7 / v8',
        footerTagCsvExport: 'Sensor-only CSV Export',
        footerTagPresentMon: 'PresentMon Frame Times',
        footerTagSensorsDts: 'DTS & Enhanced CPU Sensors',
        footerCopyright: '© 2026 Majidtech. Dikembangkan untuk analisis hardware presisi tinggi.',
        footerEngineStatus: 'Client-Side Engine Active • Zero Server Latency'
      },

      en: {
        // Navbar
        brandTitle: 'HWiNFO Analyzer',
        brandTag: 'Majidtech Telemetry Suite',
        navCompare: 'Compare',
        navChangeFile: 'Change File',
        navSessionActive: 'Session Active',
        sessionSamples: '{count} samples',
        themeToggleTitle: 'Toggle Theme (Dark/Light)',
        langToggleTitle: 'Switch Language (EN / ID)',

        // Hero & Upload
        heroEyebrow: 'High-Precision Telemetry Engine',
        heroTitle: 'HWiNFO Log Visualization & Analysis',
        heroSubtitle: 'Open HWiNFO CSV logs to analyze hundreds of hardware sensors, responsive per-variable charts, Min/Max/Average statistics, and thermal limit detection.',
        dropHeading: 'Drag & Drop HWiNFO CSV File Here',
        dropSubtext: 'Supports standard HWiNFO export format (Date, Time, Sensor Units, windows-1252 encoding)',
        btnSelectFile: 'Select CSV File',
        alertInvalidCsv: 'Please select a .csv file exported from HWiNFO.',
        readingFile: 'Reading {name} (windows-1252)...',
        calculatingStats: 'Calculating Min, Max, Average statistics...',

        // Bento Highlights
        bentoFpsLabel: 'Average Framerate',
        bentoFpsInactive: 'FPS sensor inactive',
        bentoCpuTempLabel: 'Peak CPU Temperature',
        bentoGpuTempLabel: 'Peak GPU Temperature',
        bentoCpuPowerLabel: 'Peak CPU Package Power',
        bentoGpuPowerLabel: 'Peak GPU Power',
        bentoThrottleLabel: 'Throttling Status',
        bentoAvgPrefix: 'Average:',
        bentoDetected: 'Detected',
        bentoNormal: 'Normal',
        bentoFlagsTriggered: 'limit flags triggered',
        bentoNoThrottling: 'No Thermal Throttling',

        // Category Tabs
        catHighlights: 'Highlights',
        catGaming: 'Gaming & FPS',
        catTemperatures: 'Temperatures',
        catUsage: 'Load & Usage',
        catPower: 'Power & Energy',
        catClocks: 'Clock Frequencies',
        catVoltage: 'Voltages',
        catThrottling: 'Throttling & Limits',
        catAll: 'All Sensors',
        tabsScrollPrev: 'Scroll categories left',
        tabsScrollNext: 'Scroll categories right',

        // Search & Controls
        searchPlaceholder: 'Search sensors (e.g. CPU, Temp, FPS)...',
        showingVariables: 'Showing {count} variables',
        noVariablesTitle: 'No matching variables found',
        noVariablesSub: 'Try another search keyword or select a different category tab.',

        // Cards & Stats
        statCurrent: 'CURRENT',
        statMin: 'MINIMUM',
        statMax: 'MAXIMUM',
        statAvg: 'AVERAGE',
        statLastStatus: 'LAST STATUS',
        statSessionActivity: 'SESSION ACTIVITY',
        statTriggered: 'Triggered ({count}x, {pct}%)',
        statNeverTriggered: 'Normal (Never)',
        btnExportPng: 'Export PNG',
        btnAddCompare: '+ Compare',
        btnInCompare: 'Saved in Compare',
        sensorEyebrowFallback: 'TELEMETRY SENSOR',

        // Comparison Modal
        modalTitle: 'Multi-Variable Comparison',
        modalDesc: 'Select up to 5 variables to overlay synchronously on multi-axis scale.',
        btnExportComparePng: 'Export Compare PNG',
        modalCloseLabel: 'Close Modal',
        alertMaxCompare: 'Maximum 5 variables for concurrent comparison.',

        // Footer
        footerBrandTitle: 'HWiNFO Analyzer',
        footerBrandSubtitle: 'Majidtech Telemetry Suite',
        footerDesc: 'High-precision browser-based hardware telemetry log analysis and visualization. Processes hundreds of time-series sensors instantly, securely, and with zero external server dependencies.',
        footerHeadingPrivacy: 'Privacy & Execution',
        footerHeadingTech: 'Technology & Engine',
        footerHeadingCompat: 'Compatibility',
        footerTagClientSide: '100% Client-Side',
        footerTagZeroIngestion: 'Zero Server Ingestion',
        footerTagFileReader: 'Local FileReader API',
        footerTagDecoder: 'Windows-1252 ANSI Decoder',
        footerTagChartjs: 'Chart.js v4 (Canvas 60fps)',
        footerTagPapaparse: 'PapaParse (Streaming Parser)',
        footerTagObserver: 'IntersectionObserver Lazy Load',
        footerTagMultiaxis: 'Multi-Axis Synchronized Scaling',
        footerTagHwinfoVersions: 'HWiNFO v6 / v7 / v8',
        footerTagCsvExport: 'Sensor-only CSV Export',
        footerTagPresentMon: 'PresentMon Frame Times',
        footerTagSensorsDts: 'DTS & Enhanced CPU Sensors',
        footerCopyright: '© 2026 Majidtech. Engineered for high-precision hardware analysis.',
        footerEngineStatus: 'Client-Side Engine Active • Zero Server Latency'
      }
    },

    /**
     * Initializes language preference.
     * @returns {string} active language
     */
    init() {
      const saved = localStorage.getItem('hwinfo_lang');
      if (saved && (saved === 'id' || saved === 'en')) {
        this.currentLang = saved;
      } else {
        // Default to Indonesian, or detect if browser starts with id
        this.currentLang = 'id';
      }
      return this.currentLang;
    },

    /**
     * Gets a localized string by key with optional replacements.
     * @param {string} key 
     * @param {Object} params 
     * @returns {string}
     */
    t(key, params = {}) {
      const dict = this.translations[this.currentLang] || this.translations.id;
      let text = dict[key] || this.translations.id[key] || key;

      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });

      return text;
    },

    /**
     * Sets active language and updates all static DOM elements with [data-i18n].
     * @param {string} lang ('id' | 'en')
     */
    setLanguage(lang) {
      if (lang !== 'id' && lang !== 'en') return;
      this.currentLang = lang;
      localStorage.setItem('hwinfo_lang', lang);
      document.documentElement.setAttribute('lang', lang);

      // Translate all DOM elements containing data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
          el.textContent = this.t(key);
        }
      });

      // Translate attributes e.g. placeholder, title
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
          el.setAttribute('placeholder', this.t(key));
        }
      });

      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
          el.setAttribute('title', this.t(key));
        }
      });

      // Dispatch custom event for dynamic components (Bento, Categories, Cards)
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    },

    /**
     * Toggles between 'id' and 'en'.
     */
    toggleLanguage() {
      const next = this.currentLang === 'id' ? 'en' : 'id';
      this.setLanguage(next);
      return next;
    }
  };

  window.I18n = I18n;
})(typeof window !== 'undefined' ? window : this);
