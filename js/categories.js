/**
 * Sensor Categorization & Filtering Engine
 * Organizes 300+ sensors into logical hardware domains, detects key gaming highlights,
 * and handles multi-parameter search filtering.
 */

(function (window) {
  'use strict';

  const SensorCategories = {
    CATEGORY_DEFS: [
      { id: 'highlights', nameKey: 'catHighlights', name: 'Highlights', icon: 'zap' },
      { id: 'gaming', nameKey: 'catGaming', name: 'Gaming & FPS', icon: 'gamepad-2' },
      { id: 'temperatures', nameKey: 'catTemperatures', name: 'Temperatur', icon: 'thermometer' },
      { id: 'usage', nameKey: 'catUsage', name: 'Beban & Usage', icon: 'activity' },
      { id: 'power', nameKey: 'catPower', name: 'Daya & Watt', icon: 'battery-charging' },
      { id: 'clocks', nameKey: 'catClocks', name: 'Frekuensi Clock', icon: 'gauge' },
      { id: 'voltage', nameKey: 'catVoltage', name: 'Voltase', icon: 'cpu' },
      { id: 'throttling', nameKey: 'catThrottling', name: 'Throttling & Limit', icon: 'alert-triangle' },
      { id: 'all', nameKey: 'catAll', name: 'Semua Sensor', icon: 'layers' }
    ],

    /**
     * Gets translated name of a category definition.
     */
    getCategoryName(def) {
      if (window.I18n) {
        return window.I18n.t(def.nameKey);
      }
      return def.name;
    },

    /**
     * Determines whether a column belongs to a given category ID.
     * @param {Object} col 
     * @param {string} categoryId 
     * @param {Array} allColumns
     * @returns {boolean}
     */
    matchesCategory(col, categoryId, allColumns) {
      if (categoryId === 'all') return true;

      const name = (col.displayName || col.cleanName || '').toLowerCase();
      const raw = (col.rawHeader || '').toLowerCase();
      const unit = (col.unit || '').toLowerCase();
      const hw = (col.hardwareSource || '').toLowerCase();

      switch (categoryId) {
        case 'highlights':
          return this.isHighlightSensor(col);

        case 'gaming':
          return unit === 'fps' ||
            name.includes('fps') ||
            name.includes('framerate') ||
            name.includes('frame time') ||
            name.includes('gpu busy') ||
            name.includes('gpu wait') ||
            name.includes('cpu busy') ||
            name.includes('cpu wait') ||
            (name.includes('d3d') && unit === '%');

        case 'temperatures':
          return unit === '°c' ||
            name.includes('temperature') ||
            name.includes('temp') ||
            name.includes('hot spot') ||
            name.includes('tjmax');

        case 'usage':
          return (unit === '%' || name.includes('usage') || name.includes('load') || name.includes('residency') || name.includes('utility')) &&
            !col.isBoolean &&
            unit !== '°c' &&
            unit !== 'v' &&
            unit !== 'w';

        case 'power':
          return unit === 'w' ||
            unit === 'mw' ||
            unit === 'a' ||
            name.includes('power') ||
            name.includes('current') ||
            name.includes('pl1') ||
            name.includes('pl2');

        case 'clocks':
          return unit === 'mhz' ||
            unit === 'ghz' ||
            name.includes('clock') ||
            name.includes('ratio');

        case 'voltage':
          return unit === 'v' ||
            unit === 'mv' ||
            name.includes('vid') ||
            name.includes('voltage') ||
            name.includes('offset');

        case 'throttling':
          return col.isBoolean ||
            name.includes('throttl') ||
            name.includes('limit') ||
            name.includes('critical');

        default:
          return true;
      }
    },

    /**
     * Identifies the essential ~8-12 metrics for gaming / stress test evaluation.
     * @param {Object} col 
     * @returns {boolean}
     */
    isHighlightSensor(col) {
      const name = (col.displayName || col.cleanName || '').toLowerCase();
      const raw = (col.rawHeader || '').toLowerCase();

      // Priority 1: Framerate
      if (raw.includes('framerate presented (avg)') || raw.includes('framerate displayed (avg)')) {
        return true;
      }
      // Priority 2: CPU Package Temp & GPU Temp
      if ((raw === 'cpu package [°c]' || name === 'cpu package') && (col.hardwareSource.includes('DTS') || !col.hardwareSource)) {
        return true;
      }
      if (raw === 'core max [°c]' || name === 'core max') {
        return true;
      }
      if (raw.includes('gpu temperature [°c]') || raw.includes('gpu core temperature [°c]')) {
        // Prefer discrete GPU if present
        if (col.hardwareSource.includes('NVIDIA') || col.hardwareSource.includes('GeForce') || col.hardwareSource.includes('RTX') || !col.hardwareSource.includes('UHD')) {
          return true;
        }
      }
      // Priority 3: Total CPU Usage & GPU Core Load
      if (raw === 'total cpu usage [%]' || raw === 'max cpu/thread usage [%]') {
        return true;
      }
      if (raw.includes('gpu core load [%]') || (raw.includes('gpu total usage [%]') && col.hardwareSource.includes('NVIDIA'))) {
        return true;
      }
      // Priority 4: Powers
      if (raw === 'cpu package power [w]') {
        return true;
      }
      if (raw === 'gpu power [w]' && !col.hardwareSource.includes('UHD')) {
        return true;
      }
      // Priority 5: Clocks
      if (raw === 'core clocks (avg) [mhz]' || raw === 'average effective clock [mhz]') {
        return true;
      }
      if (raw === 'gpu clock [mhz]' && col.hardwareSource.includes('NVIDIA')) {
        return true;
      }

      return false;
    },

    /**
     * Filters columns by active category and search keyword.
     * @param {Array} columns 
     * @param {string} categoryId 
     * @param {string} searchKeyword 
     * @returns {Array}
     */
    filterColumns(columns, categoryId = 'highlights', searchKeyword = '') {
      const q = (searchKeyword || '').trim().toLowerCase();

      return columns.filter(col => {
        // Category check
        const inCategory = this.matchesCategory(col, categoryId, columns);
        if (!inCategory) return false;

        // Search query check
        if (!q) return true;

        const nameMatch = (col.displayName || '').toLowerCase().includes(q) ||
          (col.cleanName || '').toLowerCase().includes(q) ||
          (col.rawHeader || '').toLowerCase().includes(q);

        const unitMatch = (col.unit || '').toLowerCase().includes(q);
        const hwMatch = (col.hardwareSource || '').toLowerCase().includes(q) ||
          (col.simplifiedHardware || '').toLowerCase().includes(q);

        return nameMatch || unitMatch || hwMatch;
      });
    },

    /**
     * Extracts top-level executive highlights (Max CPU Temp, Max GPU Temp, Avg FPS, Max CPU Power, Throttles).
     * @param {Array} columns 
     * @returns {Object}
     */
    extractExecutiveSummary(columns) {
      let maxCpuTemp = null;
      let maxGpuTemp = null;
      let avgFps = null;
      let maxCpuUsage = null;
      let maxGpuLoad = null;
      let maxCpuPower = null;
      let maxGpuPower = null;
      let throttlingDetected = false;
      let throttlingCount = 0;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const raw = (col.rawHeader || '').toLowerCase();
        const hw = (col.hardwareSource || '').toLowerCase();
        const s = col.stats;

        if (!s) continue;

        // CPU Temp
        if (raw.includes('cpu package [°c]') && (hw.includes('dts') || !maxCpuTemp)) {
          if (!maxCpuTemp || s.max > maxCpuTemp.value) {
            maxCpuTemp = { value: s.max, col: col };
          }
        }
        // GPU Temp
        if ((raw.includes('gpu temperature [°c]') || raw.includes('gpu core temperature [°c]')) && !hw.includes('uhd')) {
          if (!maxGpuTemp || s.max > maxGpuTemp.value) {
            maxGpuTemp = { value: s.max, col: col };
          }
        }
        // FPS
        if (raw.includes('framerate presented (avg)') || raw.includes('framerate displayed (avg)')) {
          avgFps = { value: s.avg, min: s.min, max: s.max, col: col };
        }
        // Total CPU Usage
        if (raw === 'total cpu usage [%]') {
          maxCpuUsage = { value: s.max, avg: s.avg, col: col };
        }
        // GPU Load
        if (raw.includes('gpu core load [%]') || (raw.includes('gpu total usage [%]') && hw.includes('nvidia'))) {
          maxGpuLoad = { value: s.max, avg: s.avg, col: col };
        }
        // CPU Power
        if (raw === 'cpu package power [w]') {
          maxCpuPower = { value: s.max, avg: s.avg, col: col };
        }
        // GPU Power
        if (raw === 'gpu power [w]' && !hw.includes('uhd')) {
          maxGpuPower = { value: s.max, avg: s.avg, col: col };
        }
        // Throttling
        if (col.isBoolean && s.hasTriggered) {
          throttlingDetected = true;
          throttlingCount++;
        }
      }

      return {
        maxCpuTemp,
        maxGpuTemp,
        avgFps,
        maxCpuUsage,
        maxGpuLoad,
        maxCpuPower,
        maxGpuPower,
        throttlingDetected,
        throttlingCount
      };
    }
  };

  window.SensorCategories = SensorCategories;
})(typeof window !== 'undefined' ? window : this);
