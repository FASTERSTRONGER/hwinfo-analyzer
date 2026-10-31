/**
 * Telemetry Statistics Module
 * Computes Min, Max, Average, Current values and provides unit-aware number formatting.
 */

(function (window) {
  'use strict';

  const TelemetryStats = {
    /**
     * Computes statistics for all columns in a dataset.
     * @param {Array} columns 
     * @returns {Array} enriched columns
     */
    enrichColumnsWithStats(columns) {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.isNumeric && col.numericData && col.numericData.length > 0) {
          col.stats = this.computeNumericStats(col.numericData, col.unit);
        } else if (col.isBoolean && col.booleanData && col.booleanData.length > 0) {
          col.stats = this.computeBooleanStats(col.booleanData);
        } else {
          col.stats = null;
        }
      }
      return columns;
    },

    /**
     * Computes min, max, average, and current for a numeric TypedArray or Array.
     * @param {Float64Array|Array<number>} data 
     * @param {string} unit 
     * @returns {Object}
     */
    computeNumericStats(data, unit = '') {
      const len = data.length;
      if (len === 0) {
        return { min: 0, max: 0, avg: 0, current: 0, formatted: {} };
      }

      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let validCount = 0;

      for (let i = 0; i < len; i++) {
        const val = data[i];
        if (!isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
          sum += val;
          validCount++;
        }
      }

      if (validCount === 0) {
        min = 0;
        max = 0;
      }

      const avg = validCount > 0 ? sum / validCount : 0;
      const current = data[len - 1];

      return {
        min: min,
        max: max,
        avg: avg,
        current: current,
        formatted: {
          min: this.formatValueWithUnit(min, unit),
          max: this.formatValueWithUnit(max, unit),
          avg: this.formatValueWithUnit(avg, unit),
          current: this.formatValueWithUnit(current, unit),
          minRaw: this.formatNumber(min, unit),
          maxRaw: this.formatNumber(max, unit),
          avgRaw: this.formatNumber(avg, unit),
          currentRaw: this.formatNumber(current, unit)
        }
      };
    },

    /**
     * Computes statistics for a boolean (Yes/No throttle) flag.
     * @param {Uint8Array|Array<number>} data 
     * @returns {Object}
     */
    computeBooleanStats(data) {
      let trueCount = 0;
      const len = data.length;

      for (let i = 0; i < len; i++) {
        if (data[i] === 1) trueCount++;
      }

      const hasTriggered = trueCount > 0;
      const pct = len > 0 ? (trueCount / len) * 100 : 0;
      const current = data[len - 1] === 1;

      return {
        hasTriggered: hasTriggered,
        trueCount: trueCount,
        totalCount: len,
        percentage: pct,
        current: current,
        formatted: {
          status: hasTriggered ? `Terpicu (${trueCount}x, ${pct.toFixed(1)}%)` : 'Normal (Tidak Pernah)',
          current: current ? 'YES' : 'NO'
        }
      };
    },

    /**
     * Formats a raw number according to hardware telemetry conventions.
     * @param {number} val 
     * @param {string} unit 
     * @returns {string}
     */
    formatNumber(val, unit = '') {
      if (val === null || val === undefined || isNaN(val)) return '-';

      const u = (unit || '').toLowerCase();

      // Voltages
      if (u === 'v') {
        return val.toFixed(3);
      }
      // Clocks, Frequencies, RPM, Memory MB
      if (u === 'mhz' || u === 'rpm' || u === 'mb' || u === 'gb' || u === 'kb') {
        if (Math.abs(val) >= 100) {
          return Math.round(val).toLocaleString('id-ID');
        }
        return val.toFixed(1);
      }
      // Temperatures, Percentages, Watts, FPS
      if (u === '°c' || u === '%' || u === 'w' || u === 'fps' || u === 'ms') {
        return val.toFixed(1);
      }
      // Ratios
      if (u === 'x') {
        return val.toFixed(2);
      }

      // Default
      if (Number.isInteger(val)) {
        return val.toLocaleString('id-ID');
      }
      return val.toFixed(2);
    },

    /**
     * Formats number and appends unit string.
     * @param {number} val 
     * @param {string} unit 
     * @returns {string}
     */
    formatValueWithUnit(val, unit = '') {
      const numStr = this.formatNumber(val, unit);
      if (!unit) return numStr;
      return `${numStr} ${unit}`;
    }
  };

  window.TelemetryStats = TelemetryStats;
})(typeof window !== 'undefined' ? window : this);
