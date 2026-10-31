/**
 * HWiNFO CSV Parser Module
 * Handles file reading (windows-1252 encoding), header extraction, footer metadata detection,
 * duplicate sensor disambiguation, and elapsed time calculation.
 */

(function (window) {
  'use strict';

  const HWiNFOParser = {
    /**
     * Reads a File or Blob and parses it into structured telemetry data.
     * @param {File|Blob} file 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async parseFile(file, options = {}) {
      const encoding = options.encoding || 'windows-1252';
      const text = await this.readFileAsText(file, encoding);
      return this.parseCSVText(text, file.name);
    },

    /**
     * Reads file with specified encoding to preserve degree Celsius (°C) and micro symbols.
     * @param {File|Blob} file 
     * @param {string} encoding 
     * @returns {Promise<string>}
     */
    readFileAsText(file, encoding = 'windows-1252') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Gagal membaca file CSV.'));
        reader.readAsText(file, encoding);
      });
    },

    /**
     * Parses raw CSV text string.
     * @param {string} csvText 
     * @param {string} fileName 
     * @returns {Object}
     */
    parseCSVText(csvText, fileName = 'telemetry.csv') {
      if (!window.Papa) {
        throw new Error('Library PapaParse tidak ditemukan.');
      }

      const parseResult = window.Papa.parse(csvText, {
        skipEmptyLines: 'greedy',
        header: false,
        dynamicTyping: false
      });

      if (!parseResult.data || parseResult.data.length < 2) {
        throw new Error('File CSV kosong atau format tidak valid.');
      }

      const rawRows = parseResult.data;
      const rawHeaders = rawRows[0];

      if (rawHeaders.length < 3 || rawHeaders[0].trim().toLowerCase() !== 'date') {
        throw new Error('File bukan merupakan format log CSV standar dari HWiNFO (Kolom pertama harus "Date").');
      }

      // Identify data rows vs footer rows
      const dataRows = [];
      let hardwareSourceRow = null;

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const col0 = (row[0] || '').trim();
        const col1 = (row[1] || '').trim();

        // Footer repeated header
        if (col0.toLowerCase() === 'date' && col1.toLowerCase() === 'time') {
          continue;
        }

        // Footer hardware source classification row (col0 is empty, but subsequent cols have hardware labels)
        if (col0 === '' && col1 === '' && row.some(cell => (cell || '').includes(':') || (cell || '').includes('System:'))) {
          hardwareSourceRow = row;
          continue;
        }

        // Valid data row (must have timestamp pattern or non-empty date)
        if (col0 !== '') {
          dataRows.push(row);
        }
      }

      if (dataRows.length === 0) {
        throw new Error('Tidak ada baris data telemetri valid yang ditemukan dalam file CSV.');
      }

      // Process Timestamps and elapsed seconds
      const timestamps = [];
      const elapsedSeconds = [];
      const timeLabels = [];

      let firstEpoch = null;

      for (let r = 0; r < dataRows.length; r++) {
        const row = dataRows[r];
        const dateStr = (row[0] || '').trim();
        const timeStr = (row[1] || '').trim();

        const epoch = this.parseHWiNFODateTime(dateStr, timeStr);
        if (r === 0) {
          firstEpoch = epoch;
        }

        const elapsed = firstEpoch !== null ? (epoch - firstEpoch) / 1000 : r * 2;
        timestamps.push(`${dateStr} ${timeStr}`);
        elapsedSeconds.push(Math.max(0, elapsed));
        timeLabels.push(this.formatElapsedSeconds(elapsed));
      }

      // Hardware source mapping
      const hardwareMap = {};
      const uniqueHardwareList = new Set();

      if (hardwareSourceRow) {
        for (let c = 2; c < rawHeaders.length; c++) {
          const hw = (hardwareSourceRow[c] || '').trim();
          if (hw) {
            hardwareMap[c] = hw;
            uniqueHardwareList.add(hw);
          }
        }
      }

      // Process columns
      const columns = [];
      const columnCounts = {};

      // Detect duplicate headers to disambiguate
      for (let c = 2; c < rawHeaders.length; c++) {
        const header = (rawHeaders[c] || '').trim();
        columnCounts[header] = (columnCounts[header] || 0) + 1;
      }

      for (let c = 2; c < rawHeaders.length; c++) {
        const rawHeader = (rawHeaders[c] || '').trim();
        if (!rawHeader) continue;

        const hwSource = hardwareMap[c] || '';
        const parsedUnit = this.extractUnit(rawHeader);
        const cleanName = this.extractCleanName(rawHeader);

        // Disambiguate duplicate names if needed
        let displayName = cleanName;
        if (columnCounts[rawHeader] > 1 && hwSource) {
          const shortHw = this.simplifyHardwareName(hwSource);
          displayName = `${cleanName} (${shortHw})`;
        }

        // Extract series values
        const rawValues = new Array(dataRows.length);
        let numericCount = 0;
        let booleanCount = 0;
        let emptyCount = 0;

        for (let r = 0; r < dataRows.length; r++) {
          const valStr = (dataRows[r][c] || '').trim();
          rawValues[r] = valStr;

          if (valStr === '') {
            emptyCount++;
          } else if (valStr === 'Yes' || valStr === 'No') {
            booleanCount++;
          } else if (!isNaN(Number(valStr))) {
            numericCount++;
          }
        }

        const isBoolean = booleanCount > 0 && booleanCount + emptyCount === dataRows.length;
        const isNumeric = !isBoolean && numericCount > 0;

        // Parse typed data
        let numericData = null;
        let booleanData = null;

        if (isNumeric) {
          numericData = new Float64Array(dataRows.length);
          for (let r = 0; r < dataRows.length; r++) {
            const v = Number(rawValues[r]);
            numericData[r] = isNaN(v) ? 0 : v;
          }
        } else if (isBoolean) {
          booleanData = new Uint8Array(dataRows.length);
          for (let r = 0; r < dataRows.length; r++) {
            booleanData[r] = rawValues[r] === 'Yes' ? 1 : 0;
          }
        }

        columns.push({
          index: c,
          rawHeader: rawHeader,
          displayName: displayName,
          cleanName: cleanName,
          unit: parsedUnit,
          hardwareSource: hwSource,
          simplifiedHardware: this.simplifyHardwareName(hwSource),
          isNumeric: isNumeric,
          isBoolean: isBoolean,
          numericData: numericData,
          booleanData: booleanData,
          rawValues: rawValues
        });
      }

      const totalDurationSec = elapsedSeconds[elapsedSeconds.length - 1] || 0;

      return {
        fileName: fileName,
        sampleCount: dataRows.length,
        totalDurationSec: totalDurationSec,
        formattedDuration: this.formatDurationLong(totalDurationSec),
        startTime: timestamps[0] || '-',
        endTime: timestamps[timestamps.length - 1] || '-',
        timestamps: timestamps,
        elapsedSeconds: elapsedSeconds,
        timeLabels: timeLabels,
        hardwareList: Array.from(uniqueHardwareList),
        columns: columns
      };
    },

    /**
     * Extracts unit in brackets, e.g. "Core Temperatures (avg) [°C]" -> "°C"
     */
    extractUnit(header) {
      const match = header.match(/\[(.*?)\]\s*$/);
      return match ? match[1].trim() : '';
    },

    /**
     * Extracts clean sensor name without bracketed unit.
     */
    extractCleanName(header) {
      return header.replace(/\[(.*?)\]\s*$/, '').trim();
    },

    /**
     * Simplifies hardware strings (e.g. "CPU [#0]: Intel Core 5 210H: DTS" -> "CPU DTS")
     */
    simplifyHardwareName(hw) {
      if (!hw) return '';
      if (hw.includes('DTS')) return 'DTS';
      if (hw.includes('Enhanced')) return 'Enhanced';
      if (hw.includes('NVIDIA')) return 'NVIDIA GPU';
      if (hw.includes('Intel UHD') || hw.includes('iGPU')) return 'iGPU';
      if (hw.includes('PresentMon')) return 'PresentMon';
      if (hw.includes('PCH')) return 'PCH';
      if (hw.includes('System:')) return 'System';
      return hw.split(':')[0].trim();
    },

    /**
     * Parses HWiNFO Date (DD.MM.YYYY) and Time (HH:mm:ss.SSS).
     */
    parseHWiNFODateTime(dateStr, timeStr) {
      try {
        const dateParts = dateStr.split('.');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const year = parseInt(dateParts[2], 10);

          const timeParts = timeStr.split(':');
          if (timeParts.length === 3) {
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            const secParts = timeParts[2].split('.');
            const seconds = parseInt(secParts[0], 10);
            const millis = secParts.length > 1 ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;

            return new Date(year, month, day, hours, minutes, seconds, millis).getTime();
          }
        }
      } catch (e) {
        // Fallback
      }
      return 0;
    },

    /**
     * Formats elapsed seconds to "mm:ss" or "hh:mm:ss"
     */
    formatElapsedSeconds(sec) {
      const totalSec = Math.floor(sec);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (hours > 0) {
        return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    /**
     * Formats total duration for summary banner (e.g. "49m 47s" or "1h 12m")
     */
    formatDurationLong(sec) {
      const totalSec = Math.round(sec);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0 || hours > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);
      return parts.join(' ');
    }
  };

  window.HWiNFOParser = HWiNFOParser;
})(typeof window !== 'undefined' ? window : this);
