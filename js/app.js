/**
 * HWiNFO Telemetry Analyzer - Core Application Controller
 * Orchestrates file ingestion, state updates, responsive rendering,
 * dark/light theme switching, and user interactions.
 */

(function (window) {
  'use strict';

  const App = {
    state: {
      parsedData: null,
      activeCategory: 'highlights',
      searchKeyword: '',
      filteredColumns: [],
      selectedForComparison: new Set(),
      comparisonChartInstance: null,
      theme: 'dark',
      tabsDragged: false
    },

    // DOM Elements
    dom: {},

    /**
     * Initializes application, caches DOM queries, and binds events.
     */
    init() {
      this.cacheDOM();
      this.initLanguage();
      this.initTheme();
      this.bindEvents();
      this.renderCategoryTabs();
      this.initCategoryTabsScroll();
    },

    /**
     * Caches frequently accessed DOM nodes.
     */
    cacheDOM() {
      this.dom = {
        appContainer: document.getElementById('app-container'),
        uploadSection: document.getElementById('upload-section'),
        dashboardSection: document.getElementById('dashboard-section'),
        dropzone: document.getElementById('dropzone-inner'),
        fileInput: document.getElementById('file-input'),
        btnSelectFile: document.getElementById('btn-select-file'),
        btnResetFile: document.getElementById('btn-reset-file'),
        btnOpenCompare: document.getElementById('btn-open-compare'),
        langToggleBtn: document.getElementById('lang-toggle-btn'),
        langCodeText: document.getElementById('lang-code-text'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeIconDark: document.getElementById('theme-icon-dark'),
        themeIconLight: document.getElementById('theme-icon-light'),
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
        sessionBadge: document.getElementById('session-badge'),
        sessionInfoText: document.getElementById('session-info-text'),
        bentoHighlights: document.getElementById('bento-highlights'),
        categoryNavShell: document.getElementById('category-nav-shell'),
        categoryTabsContainer: document.getElementById('category-tabs-container'),
        tabsPrevBtn: document.getElementById('tabs-prev-btn'),
        tabsNextBtn: document.getElementById('tabs-next-btn'),
        searchInput: document.getElementById('search-input'),
        btnClearSearch: document.getElementById('btn-clear-search'),
        telemetryGrid: document.getElementById('telemetry-grid'),
        resultsCountText: document.getElementById('results-count-text'),
        compareModal: document.getElementById('compare-modal'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        comparePillsContainer: document.getElementById('compare-pills-container'),
        compareCanvas: document.getElementById('compare-canvas'),
        btnExportComparePNG: document.getElementById('btn-export-compare-png')
      };
    },

    /**
     * Initializes i18n system, restores saved language preference,
     * and sets up languageChanged event listener.
     */
    initLanguage() {
      if (!window.I18n) return;
      const lang = window.I18n.init();
      window.I18n.setLanguage(lang);
      this.updateLangBadge(lang);

      window.addEventListener('languageChanged', (e) => {
        const nextLang = e.detail.lang;
        this.updateLangBadge(nextLang);
        this.renderCategoryTabs();
        if (this.state.parsedData) {
          this.updateSessionBadgeText();
          this.renderExecutiveBento();
          this.updateCategoryBadgeCounts();
          this.updateFilteredCards();
          if (this.dom.compareModal && this.dom.compareModal.classList.contains('open')) {
            this.renderCompareSelectorPills();
          }
        }
      });
    },

    /**
     * Updates the navbar language badge text.
     */
    updateLangBadge(lang) {
      if (this.dom.langCodeText) {
        this.dom.langCodeText.textContent = (lang || 'id').toUpperCase();
      }
    },

    /**
     * Updates the session badge info text with localized strings.
     */
    updateSessionBadgeText() {
      if (this.state.parsedData && this.dom.sessionInfoText) {
        const p = this.state.parsedData;
        const sampleLabel = window.I18n ? window.I18n.t('sessionSamples', { count: p.sampleCount }) : `${p.sampleCount} sampel`;
        const sessionTitle = `${p.fileName} (${p.formattedDuration}, ${sampleLabel})`;
        this.dom.sessionInfoText.textContent = sessionTitle;
        this.dom.sessionInfoText.title = sessionTitle;
      }
    },

    /**
     * Initializes dark/light theme system defaulting to browser/OS preference.
     */
    initTheme() {
      const savedTheme = localStorage.getItem('hwinfo_theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

      this.applyTheme(initialTheme, false);

      // Listen for system OS theme changes if user hasn't overridden manually
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (!localStorage.getItem('hwinfo_theme')) {
            this.applyTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      }
    },

    /**
     * Applies theme to DOM, icons, and chart renderer.
     * @param {string} theme ('dark' | 'light')
     * @param {boolean} isUserManual
     */
    applyTheme(theme, isUserManual = false) {
      this.state.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);

      if (isUserManual) {
        localStorage.setItem('hwinfo_theme', theme);
      }

      // Toggle theme icon
      if (this.dom.themeIconDark && this.dom.themeIconLight) {
        if (theme === 'dark') {
          // In dark mode: show Sun icon to switch to light mode
          this.dom.themeIconDark.style.display = 'none';
          this.dom.themeIconLight.style.display = 'inline-block';
        } else {
          // In light mode: show Moon icon to switch to dark mode
          this.dom.themeIconDark.style.display = 'inline-block';
          this.dom.themeIconLight.style.display = 'none';
        }
      }

      // Synchronize Chart.js theme
      if (window.ChartRenderer) {
        window.ChartRenderer.setTheme(theme);
      }

      // If comparison modal is active, refresh it
      if (this.dom.compareModal && this.dom.compareModal.classList.contains('open')) {
        this.renderCompareChart();
      }
    },

    /**
     * Toggles between dark and light themes.
     */
    toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(next, true);
    },

    /**
     * Binds user event listeners.
     */
    bindEvents() {
      // Language toggle button
      if (this.dom.langToggleBtn) {
        this.dom.langToggleBtn.addEventListener('click', () => {
          if (window.I18n) {
            window.I18n.toggleLanguage();
          }
        });
      }

      // Theme toggle button
      if (this.dom.themeToggleBtn) {
        this.dom.themeToggleBtn.addEventListener('click', () => {
          this.toggleTheme();
        });
      }

      // File input button
      this.dom.btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dom.fileInput.click();
      });

      this.dom.dropzone.addEventListener('click', () => {
        this.dom.fileInput.click();
      });

      this.dom.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.processFile(file);
      });

      // Drag and drop
      ['dragenter', 'dragover'].forEach(name => {
        this.dom.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dom.dropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        this.dom.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dom.dropzone.classList.remove('drag-over');
        });
      });

      this.dom.dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
          if (!file.name.toLowerCase().endsWith('.csv')) {
            alert(window.I18n ? window.I18n.t('alertInvalidCsv') : 'Silakan pilih file dengan ekstensi .csv hasil export dari HWiNFO.');
            return;
          }
          this.processFile(file);
        }
      });

      // Reset / Upload new file
      this.dom.btnResetFile.addEventListener('click', () => {
        this.resetState();
      });

      // Search input with debounce
      let searchTimeout = null;
      this.dom.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.state.searchKeyword = e.target.value.trim();
          this.dom.btnClearSearch.style.display = this.state.searchKeyword ? 'block' : 'none';
          this.updateFilteredCards();
        }, 180);
      });

      this.dom.btnClearSearch.addEventListener('click', () => {
        this.dom.searchInput.value = '';
        this.state.searchKeyword = '';
        this.dom.btnClearSearch.style.display = 'none';
        this.updateFilteredCards();
      });

      // Modal comparison
      this.dom.btnOpenCompare.addEventListener('click', () => {
        this.openComparisonModal();
      });

      this.dom.btnCloseModal.addEventListener('click', () => {
        this.closeComparisonModal();
      });

      this.dom.compareModal.addEventListener('click', (e) => {
        if (e.target === this.dom.compareModal) {
          this.closeComparisonModal();
        }
      });

      this.dom.btnExportComparePNG.addEventListener('click', () => {
        if (this.dom.compareCanvas) {
          window.ChartRenderer.exportChartAsPNG(this.dom.compareCanvas, 'hwinfo-komparasi.png');
        }
      });

      // Card action delegation (Export PNG, Add to Compare)
      this.dom.telemetryGrid.addEventListener('click', (e) => {
        const exportBtn = e.target.closest('.btn-export-card');
        if (exportBtn) {
          const colIndex = parseInt(exportBtn.dataset.col, 10);
          this.exportSingleCardChart(colIndex);
          return;
        }

        const compareBtn = e.target.closest('.btn-compare-toggle');
        if (compareBtn) {
          const colIndex = parseInt(compareBtn.dataset.col, 10);
          this.toggleComparisonSelection(colIndex);
          return;
        }
      });
    },

    /**
     * Renders category tabs pills.
     */
    renderCategoryTabs() {
      const defs = window.SensorCategories.CATEGORY_DEFS;
      let html = '';

      defs.forEach(def => {
        const isActive = def.id === this.state.activeCategory;
        const catName = window.SensorCategories.getCategoryName(def);
        html += `
          <button class="cat-tab-btn ${isActive ? 'active' : ''}" data-cat-id="${def.id}">
            <span>${catName}</span>
            <span class="cat-count-badge" id="cat-count-${def.id}">-</span>
          </button>
        `;
      });

      this.dom.categoryTabsContainer.innerHTML = html;

      // Bind category tab click events
      this.dom.categoryTabsContainer.querySelectorAll('.cat-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (this.state.tabsDragged) {
            e.preventDefault();
            return;
          }
          this.setActiveCategory(btn.dataset.catId);
        });
      });

      this.updateTabsScrollIndicators();
    },

    /**
     * Initializes interactive smooth scrolling, horizontal mouse wheel,
     * click-drag panning, and dynamic indicators for category tabs.
     */
    initCategoryTabsScroll() {
      const track = this.dom.categoryTabsContainer;
      const shell = this.dom.categoryNavShell;
      const prevBtn = this.dom.tabsPrevBtn;
      const nextBtn = this.dom.tabsNextBtn;

      if (!track || !shell) return;

      // Scroll listener to toggle edge fade masks & chevron arrows
      track.addEventListener('scroll', () => {
        this.updateTabsScrollIndicators();
      }, { passive: true });

      // Arrow buttons
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const step = Math.max(180, track.clientWidth * 0.65);
          track.scrollBy({ left: -step, behavior: 'smooth' });
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const step = Math.max(180, track.clientWidth * 0.65);
          track.scrollBy({ left: step, behavior: 'smooth' });
        });
      }

      // Horizontal wheel mapping: regular vertical mouse wheel scrolls tabs horizontally
      track.addEventListener('wheel', (e) => {
        if (track.scrollWidth > track.clientWidth) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX) || e.deltaX === 0) {
            e.preventDefault();
            track.scrollLeft += e.deltaY;
            this.updateTabsScrollIndicators();
          }
        }
      }, { passive: false });

      // Mouse drag-to-scroll (pan gesture for desktop)
      let isDown = false;
      let startX = 0;
      let startScrollLeft = 0;

      track.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDown = true;
        this.state.tabsDragged = false;
        startX = e.pageX - track.offsetLeft;
        startScrollLeft = track.scrollLeft;
        track.classList.add('is-dragging');
      });

      window.addEventListener('mouseup', () => {
        if (isDown) {
          isDown = false;
          track.classList.remove('is-dragging');
          setTimeout(() => {
            this.state.tabsDragged = false;
          }, 60);
        }
      });

      track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const currentX = e.pageX - track.offsetLeft;
        const delta = currentX - startX;
        if (Math.abs(delta) > 5) {
          this.state.tabsDragged = true;
        }
        track.scrollLeft = startScrollLeft - delta;
        this.updateTabsScrollIndicators();
      });

      // Window resize / orientation change listener
      window.addEventListener('resize', () => {
        this.updateTabsScrollIndicators();
      });

      // Initial layout check
      requestAnimationFrame(() => {
        this.updateTabsScrollIndicators();
      });
    },

    /**
     * Calculates whether tabs overflow on the left or right,
     * applying state classes to the shell.
     */
    updateTabsScrollIndicators() {
      const track = this.dom.categoryTabsContainer;
      const shell = this.dom.categoryNavShell;
      if (!track || !shell) return;

      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const canLeft = track.scrollLeft > 6;
      const canRight = track.scrollLeft < maxScroll - 6;

      shell.classList.toggle('can-scroll-left', canLeft);
      shell.classList.toggle('can-scroll-right', canRight);
    },

    /**
     * Sets active category and updates view.
     */
    setActiveCategory(catId) {
      this.state.activeCategory = catId;
      this.dom.categoryTabsContainer.querySelectorAll('.cat-tab-btn').forEach(btn => {
        const isActive = btn.dataset.catId === catId;
        btn.classList.toggle('active', isActive);
        if (isActive) {
          btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      });
      this.updateFilteredCards();
    },

    /**
     * Shows loading overlay with custom message.
     */
    showLoading(message = 'Memproses data CSV...') {
      this.dom.loadingText.textContent = message;
      this.dom.loadingOverlay.classList.add('active');
    },

    /**
     * Hides loading overlay.
     */
    hideLoading() {
      this.dom.loadingOverlay.classList.remove('active');
    },

    /**
     * Processes uploaded File instance.
     */
    async processFile(file) {
      try {
        const readingMsg = window.I18n ? window.I18n.t('readingFile', { name: file.name }) : `Membaca ${file.name} (windows-1252)...`;
        this.showLoading(readingMsg);

        const parsed = await window.HWiNFOParser.parseFile(file);

        const statsMsg = window.I18n ? window.I18n.t('calculatingStats') : 'Menghitung statistik Min, Max, Average...';
        this.showLoading(statsMsg);
        window.TelemetryStats.enrichColumnsWithStats(parsed.columns);

        this.state.parsedData = parsed;
        window.ChartRenderer.setData(parsed);

        // Pre-select 3 curated sensors for comparison
        this.initDefaultComparisonSelection();

        // Render dashboard views
        this.renderExecutiveBento();
        this.updateCategoryBadgeCounts();
        this.updateFilteredCards();

        // Transition UI
        this.dom.uploadSection.style.display = 'none';
        this.dom.dashboardSection.style.display = 'block';
        this.dom.sessionBadge.style.display = 'inline-flex';
        this.dom.btnOpenCompare.style.display = 'inline-flex';
        this.dom.btnResetFile.style.display = 'inline-flex';
        this.updateSessionBadgeText();

        requestAnimationFrame(() => {
          this.updateTabsScrollIndicators();
        });

        this.hideLoading();
      } catch (err) {
        this.hideLoading();
        console.error(err);
        alert(`Terjadi kesalahan: ${err.message}`);
      }
    },

    /**
     * Sets default sensors for multi-variable comparison.
     */
    initDefaultComparisonSelection() {
      this.state.selectedForComparison.clear();
      const cols = this.state.parsedData.columns;

      // Find FPS
      const fps = cols.find(c => c.rawHeader.toLowerCase().includes('framerate presented (avg)'));
      if (fps) this.state.selectedForComparison.add(fps.index);

      // Find CPU Temp
      const cpuTemp = cols.find(c => c.rawHeader.toLowerCase() === 'cpu package [°c]' && c.hardwareSource.includes('DTS'));
      if (cpuTemp) this.state.selectedForComparison.add(cpuTemp.index);

      // Find GPU Temp
      const gpuTemp = cols.find(c => c.rawHeader.toLowerCase().includes('gpu temperature [°c]') && !c.hardwareSource.includes('UHD'));
      if (gpuTemp) this.state.selectedForComparison.add(gpuTemp.index);
    },

    /**
     * Renders executive bento cards.
     */
    renderExecutiveBento() {
      if (!this.state.parsedData) return;
      const cols = this.state.parsedData.columns;
      const exec = window.SensorCategories.extractExecutiveSummary(cols);
      const t = (k, p) => window.I18n ? window.I18n.t(k, p) : k;

      const fpsVal = exec.avgFps ? `${exec.avgFps.value.toFixed(1)} FPS` : '-';
      const fpsSub = exec.avgFps ? `Min: ${exec.avgFps.min.toFixed(0)} | Max: ${exec.avgFps.max.toFixed(0)}` : t('bentoFpsInactive');

      const cpuTempVal = exec.maxCpuTemp ? `${exec.maxCpuTemp.value.toFixed(1)} °C` : '-';
      const cpuTempSub = exec.maxCpuTemp ? `${t('bentoAvgPrefix')} ${exec.maxCpuTemp.col.stats.avg.toFixed(1)} °C` : '-';

      const gpuTempVal = exec.maxGpuTemp ? `${exec.maxGpuTemp.value.toFixed(1)} °C` : '-';
      const gpuTempSub = exec.maxGpuTemp ? `${t('bentoAvgPrefix')} ${exec.maxGpuTemp.col.stats.avg.toFixed(1)} °C` : '-';

      const cpuPowerVal = exec.maxCpuPower ? `${exec.maxCpuPower.value.toFixed(1)} W` : '-';
      const cpuPowerSub = exec.maxCpuPower ? `${t('bentoAvgPrefix')} ${exec.maxCpuPower.avg.toFixed(1)} W` : '-';

      const gpuPowerVal = exec.maxGpuPower ? `${exec.maxGpuPower.value.toFixed(1)} W` : '-';
      const gpuPowerSub = exec.maxGpuPower ? `${t('bentoAvgPrefix')} ${exec.maxGpuPower.avg.toFixed(1)} W` : '-';

      const throttleVal = exec.throttlingDetected ? t('bentoDetected') : t('bentoNormal');
      const throttleTheme = exec.throttlingDetected ? 'theme-rose' : 'theme-emerald';
      const throttleSub = exec.throttlingDetected ? `${exec.throttlingCount} ${t('bentoFlagsTriggered')}` : t('bentoNoThrottling');

      this.dom.bentoHighlights.innerHTML = `
        <div class="bento-card-shell bento-span-4 theme-emerald">
          <div class="bento-card-core">
            <div class="bento-header">
              <span class="bento-label">${t('bentoFpsLabel')}</span>
              <span class="bento-icon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
                  <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
                  <rect x="2" y="6" width="20" height="12" rx="3"/>
                </svg>
              </span>
            </div>
            <div>
              <div class="bento-metric-val">${fpsVal}</div>
              <div class="bento-metric-sub">${fpsSub}</div>
            </div>
          </div>
        </div>

        <div class="bento-card-shell bento-span-4 theme-rose">
          <div class="bento-card-core">
            <div class="bento-header">
              <span class="bento-label">${t('bentoCpuTempLabel')}</span>
              <span class="bento-icon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
              </span>
            </div>
            <div>
              <div class="bento-metric-val">${cpuTempVal}</div>
              <div class="bento-metric-sub">${cpuTempSub}</div>
            </div>
          </div>
        </div>

        <div class="bento-card-shell bento-span-4 theme-amber">
          <div class="bento-card-core">
            <div class="bento-header">
              <span class="bento-label">${t('bentoGpuTempLabel')}</span>
              <span class="bento-icon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                  <rect x="9" y="9" width="6" height="6"/>
                  <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
                  <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
                  <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
                  <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
                </svg>
              </span>
            </div>
            <div>
              <div class="bento-metric-val">${gpuTempVal}</div>
              <div class="bento-metric-sub">${gpuTempSub}</div>
            </div>
          </div>
        </div>

        <div class="bento-card-shell bento-span-4 theme-cyan">
          <div class="bento-card-core">
            <div class="bento-header">
              <span class="bento-label">${t('bentoCpuPowerLabel')}</span>
              <span class="bento-icon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </span>
            </div>
            <div>
              <div class="bento-metric-val">${cpuPowerVal}</div>
              <div class="bento-metric-sub">${cpuPowerSub}</div>
            </div>
          </div>
        </div>

        <div class="bento-card-shell bento-span-4 theme-cyan">
          <div class="bento-card-core">
            <div class="bento-header">
              <span class="bento-label">${t('bentoGpuPowerLabel')}</span>
              <span class="bento-icon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19"/>
                  <path d="M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"/>
                  <line x1="23" y1="13" x2="23" y2="11"/>
                  <polygon points="11 6 7 13 13 13 9 20"/>
                </svg>
              </span>
            </div>
            <div>
              <div class="bento-metric-val">${gpuPowerVal}</div>
              <div class="bento-metric-sub">${gpuPowerSub}</div>
            </div>
          </div>
        </div>

        <div class="bento-card-shell bento-span-4 ${throttleTheme}">
          <div class="bento-card-core">
            <div class="bento-header">
              <span class="bento-label">${t('bentoThrottleLabel')}</span>
              <span class="bento-icon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
            </div>
            <div>
              <div class="bento-metric-val">${throttleVal}</div>
              <div class="bento-metric-sub">${throttleSub}</div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Updates badge count numbers on category tabs.
     */
    updateCategoryBadgeCounts() {
      if (!this.state.parsedData) return;
      const cols = this.state.parsedData.columns;
      const defs = window.SensorCategories.CATEGORY_DEFS;

      defs.forEach(def => {
        const count = cols.filter(c => window.SensorCategories.matchesCategory(c, def.id, cols)).length;
        const el = document.getElementById(`cat-count-${def.id}`);
        if (el) el.textContent = count;
      });
    },

    /**
     * Filters columns and renders cards in the grid.
     */
    updateFilteredCards() {
      if (!this.state.parsedData) return;

      const cols = this.state.parsedData.columns;
      const filtered = window.SensorCategories.filterColumns(
        cols,
        this.state.activeCategory,
        this.state.searchKeyword
      );

      const t = (k, p) => window.I18n ? window.I18n.t(k, p) : k;

      this.state.filteredColumns = filtered;
      this.dom.resultsCountText.textContent = t('showingVariables', { count: filtered.length });

      if (filtered.length === 0) {
        this.dom.telemetryGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-tertiary);">
            <p style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">${t('noVariablesTitle')}</p>
            <p style="font-size: 0.8125rem;">${t('noVariablesSub')}</p>
          </div>
        `;
        return;
      }

      // Generate HTML for cards
      let html = '';
      filtered.forEach(col => {
        const s = col.stats;
        const isSelected = this.state.selectedForComparison.has(col.index);

        let statsHTML = '';
        if (col.isNumeric && s) {
          statsHTML = `
            <div class="stat-pill">
              <span class="stat-pill-label">${t('statCurrent')}</span>
              <span class="stat-pill-value" title="${s.formatted.current}">${s.formatted.currentRaw}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-label">${t('statMin')}</span>
              <span class="stat-pill-value" title="${s.formatted.min}">${s.formatted.minRaw}</span>
            </div>
            <div class="stat-pill pill-max">
              <span class="stat-pill-label">${t('statMax')}</span>
              <span class="stat-pill-value" title="${s.formatted.max}">${s.formatted.maxRaw}</span>
            </div>
            <div class="stat-pill pill-avg">
              <span class="stat-pill-label">${t('statAvg')}</span>
              <span class="stat-pill-value" title="${s.formatted.avg}">${s.formatted.avgRaw}</span>
            </div>
          `;
        } else if (col.isBoolean && s) {
          const statusText = s.hasTriggered
            ? t('statTriggered', { count: s.trueCount, pct: s.percentage.toFixed(1) })
            : t('statNeverTriggered');
          statsHTML = `
            <div class="stat-pill" style="grid-column: span 2;">
              <span class="stat-pill-label">${t('statLastStatus')}</span>
              <span class="stat-pill-value">${s.current ? 'YES' : 'NO'}</span>
            </div>
            <div class="stat-pill ${s.hasTriggered ? 'pill-max' : ''}" style="grid-column: span 2;">
              <span class="stat-pill-label">${t('statSessionActivity')}</span>
              <span class="stat-pill-value">${statusText}</span>
            </div>
          `;
        }

        html += `
          <div class="telemetry-card-shell" id="card-${col.index}" data-col-index="${col.index}">
            <div class="telemetry-card-core">
              <div class="card-header-row">
                <div class="card-titles">
                  <span class="card-eyebrow">${col.simplifiedHardware || t('sensorEyebrowFallback')}</span>
                  <h3 class="card-variable-name" title="${col.rawHeader}">${col.displayName}</h3>
                </div>
                <span class="card-unit-pill">${col.unit || (col.isBoolean ? 'Yes/No' : '-')}</span>
              </div>

              <div class="stats-badges-matrix">
                ${statsHTML}
              </div>

              <div class="card-chart-area">
                <canvas class="telemetry-chart-canvas"></canvas>
              </div>

              <div class="card-footer-row">
                <button class="card-action-btn btn-export-card" data-col="${col.index}" title="Download grafik PNG">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>${t('btnExportPng')}</span>
                </button>

                <button class="card-action-btn btn-compare-toggle ${isSelected ? 'active' : ''}" data-col="${col.index}" style="${isSelected ? 'color: var(--accent-cyan); background: rgba(6,182,212,0.1);' : ''}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></svg>
                  <span>${isSelected ? t('btnInCompare') : t('btnAddCompare')}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      this.dom.telemetryGrid.innerHTML = html;

      // Pass DOM elements to Lazy Observer
      const cardNodes = this.dom.telemetryGrid.querySelectorAll('.telemetry-card-shell');
      window.ChartRenderer.observeCards(cardNodes);
    },

    /**
     * Toggles a variable's inclusion in comparison overlay.
     */
    toggleComparisonSelection(colIndex) {
      const t = (k, p) => window.I18n ? window.I18n.t(k, p) : k;

      if (this.state.selectedForComparison.has(colIndex)) {
        this.state.selectedForComparison.delete(colIndex);
      } else {
        if (this.state.selectedForComparison.size >= 5) {
          alert(t('alertMaxCompare'));
          return;
        }
        this.state.selectedForComparison.add(colIndex);
      }

      // Update button visual states
      const cardBtn = document.querySelector(`#card-${colIndex} .btn-compare-toggle`);
      if (cardBtn) {
        const isSelected = this.state.selectedForComparison.has(colIndex);
        cardBtn.style.color = isSelected ? 'var(--accent-cyan)' : '';
        cardBtn.style.background = isSelected ? 'rgba(6, 182, 212, 0.1)' : '';
        cardBtn.querySelector('span').textContent = isSelected ? t('btnInCompare') : t('btnAddCompare');
      }
    },

    /**
     * Opens the multi-variable comparison modal.
     */
    openComparisonModal() {
      if (!this.state.parsedData) return;
      this.dom.compareModal.classList.add('open');
      this.renderCompareSelectorPills();
      this.renderCompareChart();
    },

    /**
     * Closes the comparison modal.
     */
    closeComparisonModal() {
      this.dom.compareModal.classList.remove('open');
      if (this.state.comparisonChartInstance) {
        try { this.state.comparisonChartInstance.destroy(); } catch (e) { }
        this.state.comparisonChartInstance = null;
      }
    },

    /**
     * Renders quick selectable sensor pills inside modal.
     */
    renderCompareSelectorPills() {
      const cols = this.state.parsedData.columns;
      const numericCols = cols.filter(c => c.isNumeric);

      let html = '';
      numericCols.forEach(col => {
        const isSel = this.state.selectedForComparison.has(col.index);
        html += `
          <button class="compare-chip ${isSel ? 'selected' : ''}" data-col="${col.index}">
            ${col.displayName} [${col.unit || '-'}]
          </button>
        `;
      });

      this.dom.comparePillsContainer.innerHTML = html;

      this.dom.comparePillsContainer.querySelectorAll('.compare-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const cIdx = parseInt(chip.dataset.col, 10);
          this.toggleComparisonSelection(cIdx);
          chip.classList.toggle('selected', this.state.selectedForComparison.has(cIdx));
          this.renderCompareChart();
        });
      });
    },

    /**
     * Renders comparison Chart.js canvas.
     */
    renderCompareChart() {
      if (this.state.comparisonChartInstance) {
        try { this.state.comparisonChartInstance.destroy(); } catch (e) { }
        this.state.comparisonChartInstance = null;
      }

      const selectedIndices = Array.from(this.state.selectedForComparison);
      const selectedCols = this.state.parsedData.columns.filter(c => selectedIndices.includes(c.index));

      if (selectedCols.length === 0) {
        return;
      }

      this.state.comparisonChartInstance = window.ChartRenderer.renderComparisonChart(
        this.dom.compareCanvas,
        selectedCols
      );
    },

    /**
     * Exports a single card's chart to PNG.
     */
    exportSingleCardChart(colIndex) {
      const cardEl = document.getElementById(`card-${colIndex}`);
      if (!cardEl) return;
      const canvas = cardEl.querySelector('canvas.telemetry-chart-canvas');
      if (!canvas) return;

      const col = this.state.parsedData.columns.find(c => c.index === colIndex);
      const safeName = (col ? col.displayName : `sensor-${colIndex}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      window.ChartRenderer.exportChartAsPNG(canvas, `${safeName}.png`);
    },

    /**
     * Resets application state and returns to upload screen.
     */
    resetState() {
      window.ChartRenderer.destroyAllCharts();
      this.state.parsedData = null;
      this.state.filteredColumns = [];
      this.state.selectedForComparison.clear();

      this.dom.fileInput.value = '';
      this.dom.sessionBadge.style.display = 'none';
      this.dom.btnOpenCompare.style.display = 'none';
      this.dom.btnResetFile.style.display = 'none';
      this.dom.dashboardSection.style.display = 'none';
      this.dom.uploadSection.style.display = 'block';
    }
  };

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });

  window.App = App;
})(typeof window !== 'undefined' ? window : this);
