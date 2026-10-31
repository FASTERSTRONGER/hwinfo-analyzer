/**
 * Telemetry Chart Renderer Module
 * Powered by Chart.js v4 with lazy-loading IntersectionObserver,
 * multi-variable comparison overlay, dark/light theme awareness, and high-res PNG export.
 */

(function (window) {
  'use strict';

  const ChartRenderer = {
    // Registry of active Chart.js instances: { cardId: chartInstance }
    activeCharts: new Map(),
    // IntersectionObserver for lazy rendering
    observer: null,
    // Current dataset context
    currentData: null,
    // Current active visual theme ('dark' | 'light')
    theme: 'dark',
    // Max concurrent active chart instances
    MAX_ACTIVE_CHARTS: 35,

    /**
     * Initializes the intersection observer.
     */
    initObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const cardEl = entry.target;
          const colIndex = parseInt(cardEl.dataset.colIndex, 10);

          if (entry.isIntersecting) {
            this.renderChartForCard(cardEl, colIndex);
          } else {
            // If scrolled far away and active count exceeds limit, safely destroy to conserve memory
            if (this.activeCharts.size > this.MAX_ACTIVE_CHARTS) {
              this.destroyChartForCard(cardEl);
            }
          }
        });
      }, {
        root: null,
        rootMargin: '120px 0px 120px 0px',
        threshold: 0.05
      });
    },

    /**
     * Sets the active telemetry dataset and cleans up existing charts.
     * @param {Object} parsedData 
     */
    setData(parsedData) {
      this.destroyAllCharts();
      this.currentData = parsedData;
      this.initObserver();
    },

    /**
     * Updates theme and synchronizes all active Chart.js instances.
     * @param {string} newTheme ('dark' | 'light')
     */
    setTheme(newTheme) {
      this.theme = newTheme;
      const isLight = newTheme === 'light';

      const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
      const tickColor = isLight ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.4)';
      const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(11, 15, 25, 0.94)';
      const tooltipTitle = isLight ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.65)';
      const tooltipBody = isLight ? '#0f172a' : '#ffffff';
      const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';

      this.activeCharts.forEach(chart => {
        if (chart.options.scales) {
          if (chart.options.scales.x) {
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.x.ticks.color = tickColor;
          }
          if (chart.options.scales.y) {
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.y.ticks.color = tickColor;
          }
        }
        if (chart.options.plugins && chart.options.plugins.tooltip) {
          chart.options.plugins.tooltip.backgroundColor = tooltipBg;
          chart.options.plugins.tooltip.titleColor = tooltipTitle;
          chart.options.plugins.tooltip.bodyColor = tooltipBody;
          chart.options.plugins.tooltip.borderColor = tooltipBorder;
        }
        chart.update('none');
      });
    },

    /**
     * Destroys all currently active chart instances.
     */
    destroyAllCharts() {
      this.activeCharts.forEach(chart => {
        try { chart.destroy(); } catch (e) { }
      });
      this.activeCharts.clear();
    },

    /**
     * Observes a list of card elements for lazy rendering.
     * @param {NodeList|Array} cardElements 
     */
    observeCards(cardElements) {
      if (!this.observer) this.initObserver();
      cardElements.forEach(el => this.observer.observe(el));
    },

    /**
     * Renders a Chart.js line chart on a specific card element.
     * @param {HTMLElement} cardEl 
     * @param {number} colIndex 
     */
    renderChartForCard(cardEl, colIndex) {
      if (!this.currentData) return;
      const col = this.currentData.columns.find(c => c.index === colIndex);
      if (!col) return;

      const canvas = cardEl.querySelector('canvas.telemetry-chart-canvas');
      if (!canvas) return;

      const cardId = cardEl.id || `card-${colIndex}`;
      if (this.activeCharts.has(cardId)) {
        return; // Already rendered
      }

      const isLight = this.theme === 'light';
      const palette = this.getPaletteForSensor(col);
      const ctx = canvas.getContext('2d');

      // Gradient background fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, palette.gradientStart);
      gradient.addColorStop(1, palette.gradientEnd);

      const labels = this.currentData.timeLabels;
      const rawData = col.isNumeric ? Array.from(col.numericData) : Array.from(col.booleanData);

      const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
      const tickColor = isLight ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.4)';
      const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(11, 15, 25, 0.94)';
      const tooltipTitle = isLight ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.65)';
      const tooltipBody = isLight ? '#0f172a' : '#ffffff';
      const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';

      const config = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: col.displayName,
            data: rawData,
            borderColor: palette.borderColor,
            borderWidth: 1.8,
            backgroundColor: gradient,
            fill: true,
            tension: 0.25,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: palette.borderColor,
            pointHoverBorderColor: isLight ? '#0f172a' : '#ffffff',
            pointHoverBorderWidth: 2,
            stepped: col.isBoolean ? 'before' : false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 450,
            easing: 'easeOutQuart'
          },
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: tooltipBg,
              titleColor: tooltipTitle,
              bodyColor: tooltipBody,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                title: (items) => {
                  if (!items.length) return '';
                  const idx = items[0].dataIndex;
                  return `${this.currentData.timestamps[idx]} (+${items[0].label})`;
                },
                label: (context) => {
                  const val = context.parsed.y;
                  if (col.isBoolean) {
                    return `${col.cleanName}: ${val === 1 ? 'YES (Active)' : 'NO'}`;
                  }
                  return `${col.cleanName}: ${val.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${col.unit}`;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              grid: {
                color: gridColor,
                drawBorder: false
              },
              ticks: {
                color: tickColor,
                font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
                maxTicksLimit: 6,
                maxRotation: 0
              }
            },
            y: {
              display: true,
              grid: {
                color: gridColor,
                drawBorder: false
              },
              ticks: {
                color: tickColor,
                font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
                maxTicksLimit: 4,
                callback: (val) => {
                  if (col.isBoolean) return val === 1 ? 'YES' : 'NO';
                  return val.toLocaleString('id-ID', { maximumFractionDigits: 1 });
                }
              },
              beginAtZero: col.isBoolean || col.unit === '%' || col.unit === 'W' || col.unit === 'FPS'
            }
          }
        }
      };

      const chartInstance = new window.Chart(ctx, config);
      this.activeCharts.set(cardId, chartInstance);
    },

    /**
     * Destroys the Chart.js instance for a given card to save memory.
     * @param {HTMLElement} cardEl 
     */
    destroyChartForCard(cardEl) {
      const cardId = cardEl.id || `card-${cardEl.dataset.colIndex}`;
      if (this.activeCharts.has(cardId)) {
        try {
          this.activeCharts.get(cardId).destroy();
        } catch (e) { }
        this.activeCharts.delete(cardId);
      }
    },

    /**
     * Returns color palette based on sensor type.
     * @param {Object} col 
     * @returns {Object}
     */
    getPaletteForSensor(col) {
      const unit = (col.unit || '').toLowerCase();
      const name = (col.cleanName || '').toLowerCase();
      const isLight = this.theme === 'light';

      // Temperatures: Warm Rose/Crimson
      if (unit === '°c' || name.includes('temp') || name.includes('tjmax')) {
        return {
          borderColor: isLight ? '#e11d48' : '#f43f5e',
          gradientStart: isLight ? 'rgba(225, 29, 72, 0.2)' : 'rgba(244, 63, 94, 0.28)',
          gradientEnd: isLight ? 'rgba(225, 29, 72, 0.01)' : 'rgba(244, 63, 94, 0.01)'
        };
      }
      // FPS / Gaming: Neon Emerald
      if (unit === 'fps' || name.includes('framerate')) {
        return {
          borderColor: isLight ? '#059669' : '#10b981',
          gradientStart: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.28)',
          gradientEnd: isLight ? 'rgba(5, 150, 105, 0.01)' : 'rgba(16, 185, 129, 0.01)'
        };
      }
      // Power (Watts): Golden Amber
      if (unit === 'w' || unit === 'mw' || name.includes('power')) {
        return {
          borderColor: isLight ? '#d97706' : '#f59e0b',
          gradientStart: isLight ? 'rgba(217, 119, 6, 0.2)' : 'rgba(245, 158, 11, 0.28)',
          gradientEnd: isLight ? 'rgba(217, 119, 6, 0.01)' : 'rgba(245, 158, 11, 0.01)'
        };
      }
      // Voltages: Electric Blue
      if (unit === 'v' || unit === 'mv') {
        return {
          borderColor: isLight ? '#2563eb' : '#3b82f6',
          gradientStart: isLight ? 'rgba(37, 99, 235, 0.2)' : 'rgba(59, 130, 246, 0.28)',
          gradientEnd: isLight ? 'rgba(37, 99, 235, 0.01)' : 'rgba(59, 130, 246, 0.01)'
        };
      }
      // Clocks / Frequencies: Violet Purple
      if (unit === 'mhz' || unit === 'ghz') {
        return {
          borderColor: isLight ? '#7c3aed' : '#a855f7',
          gradientStart: isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(168, 85, 247, 0.28)',
          gradientEnd: isLight ? 'rgba(124, 58, 237, 0.01)' : 'rgba(168, 85, 247, 0.01)'
        };
      }
      // Throttles: Alert Red
      if (col.isBoolean) {
        return {
          borderColor: '#dc2626',
          gradientStart: 'rgba(220, 38, 38, 0.3)',
          gradientEnd: 'rgba(220, 38, 38, 0.02)'
        };
      }
      // Usages / Load (%): Vibrant Cyan
      if (unit === '%' || name.includes('load') || name.includes('usage')) {
        return {
          borderColor: isLight ? '#0284c7' : '#06b6d4',
          gradientStart: isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(6, 182, 212, 0.28)',
          gradientEnd: isLight ? 'rgba(2, 132, 199, 0.01)' : 'rgba(6, 182, 212, 0.01)'
        };
      }

      // Default
      return {
        borderColor: isLight ? '#0284c7' : '#38bdf8',
        gradientStart: isLight ? 'rgba(2, 132, 199, 0.18)' : 'rgba(56, 189, 248, 0.25)',
        gradientEnd: isLight ? 'rgba(2, 132, 199, 0.01)' : 'rgba(56, 189, 248, 0.01)'
      };
    },

    /**
     * Renders a multi-variable comparison chart.
     * @param {HTMLCanvasElement} canvas 
     * @param {Array<Object>} selectedCols 
     * @returns {Object} Chart.js instance
     */
    renderComparisonChart(canvas, selectedCols) {
      if (!this.currentData || !selectedCols || selectedCols.length === 0) return null;

      const isLight = this.theme === 'light';
      const distinctColors = isLight
        ? ['#e11d48', '#059669', '#0284c7', '#d97706', '#7c3aed', '#2563eb']
        : ['#f43f5e', '#10b981', '#06b6d4', '#f59e0b', '#a855f7', '#3b82f6'];

      const datasets = [];
      const unitAxisMap = {};
      let axisIndex = 0;

      selectedCols.forEach((col, idx) => {
        const unitKey = col.unit || 'unitless';
        if (!unitAxisMap[unitKey]) {
          const axisId = axisIndex === 0 ? 'y' : `y${axisIndex}`;
          unitAxisMap[unitKey] = {
            id: axisId,
            unit: col.unit,
            position: axisIndex % 2 === 0 ? 'left' : 'right'
          };
          axisIndex++;
        }

        const axisInfo = unitAxisMap[unitKey];
        const color = distinctColors[idx % distinctColors.length];
        const rawData = col.isNumeric ? Array.from(col.numericData) : Array.from(col.booleanData);

        datasets.push({
          label: `${col.displayName} [${col.unit || '-'}]`,
          data: rawData,
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          yAxisID: axisInfo.id,
          tension: 0.2
        });
      });

      const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
      const tickColor = isLight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.45)';
      const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(11, 15, 25, 0.95)';
      const tooltipTitle = isLight ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.65)';
      const tooltipBody = isLight ? '#0f172a' : '#ffffff';
      const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
      const legendColor = isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.85)';

      const scales = {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
            maxTicksLimit: 8
          }
        }
      };

      Object.values(unitAxisMap).forEach((info) => {
        scales[info.id] = {
          type: 'linear',
          position: info.position,
          title: {
            display: true,
            text: info.unit,
            color: isLight ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.55)',
            font: { size: 11, weight: '500' }
          },
          grid: {
            drawOnChartArea: info.id === 'y',
            color: gridColor
          },
          ticks: {
            color: tickColor,
            font: { size: 10 }
          }
        };
      });

      const ctx = canvas.getContext('2d');
      return new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: this.currentData.timeLabels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: legendColor,
                boxWidth: 12,
                font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }
              }
            },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: tooltipTitle,
              bodyColor: tooltipBody,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 12
            }
          },
          scales: scales
        }
      });
    },

    /**
     * Exports a canvas as a high-resolution PNG download.
     * @param {HTMLCanvasElement} canvas 
     * @param {string} fileName 
     */
    exportChartAsPNG(canvas, fileName = 'hwinfo-chart.png') {
      try {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const ctx = exportCanvas.getContext('2d');

        // Adaptive background fill
        ctx.fillStyle = this.theme === 'light' ? '#ffffff' : '#06080d';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        const dataUrl = exportCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Gagal mengekspor grafik:', err);
      }
    }
  };

  window.ChartRenderer = ChartRenderer;
})(typeof window !== 'undefined' ? window : this);
