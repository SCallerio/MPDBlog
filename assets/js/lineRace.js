// assets/js/lineRace.js
// ECharts "line race" of a cumulative value per company over time.
// Based on https://echarts.apache.org/examples/en/editor.html?c=line-race
// Data: a long-format JSON table [[time, company, value], ...] with a header
// row, as written by script/line_race_data.py (null = company not started yet).
//
// Needs assets/js/chartTheme.js loaded first.
//
// Usage:
//   renderLineRace('metros-line-race', '/data/processed/metros_perforados_cumsum.json', {
//     title: 'Cumulative meters drilled by company',
//     yAxisName: 'Cumulative meters (log scale)',
//     unit: 'm',
//   });

(function () {
  const { PALETTE, INK, BRAND_FALLBACK, brandColor } = window.MPDChartTheme;
  const RACE_MS = 12000;

  // Charts sharing opts.colorKey give each company the same color slot, so a
  // company keeps its color across charts that rank it differently.
  const colorMaps = {};
  const drawQueue = {};
  function colorSlots(companies, key) {
    if (!key) return companies.map((c, i) => i);
    const map = colorMaps[key] || (colorMaps[key] = {});
    const used = new Set(Object.values(map));
    companies.forEach(c => {
      if (!(c in map)) {
        let slot = 0;
        while (used.has(slot)) slot++;
        map[c] = slot;
        used.add(slot);
      }
    });
    return companies.map(c => map[c]);
  }

  const fmtValue = window.MPDChartTheme.fmtValue;

  function buildOption(rawData, theme, opts) {
    const header = rawData[0];
    const [dimTime, dimCompany, dimValue] = header;
    const iMes = 0, iEmp = 1, iVal = 2;
    const rows = rawData.slice(1);
    const fmt = v => fmtValue(v, opts.unit);

    // Companies ordered by final cumulative meters -> stable color slots.
    const lastMes = rows.reduce((m, r) => (r[iMes] > m ? r[iMes] : m), '');
    const companies = rows
      .filter(r => r[iMes] === lastMes)
      .sort((a, b) => (b[iVal] || 0) - (a[iVal] || 0))
      .map(r => r[iEmp]);

    // Companies start on different months, so give the axis every month.
    const months = Array.from(new Set(rows.map(r => r[iMes]))).sort();

    const colors = PALETTE[theme];
    let lineColors;
    if (opts.brandColors) {
      const others = companies.filter(c => !brandColor(c, theme));
      const otherSlots = colorSlots(others, opts.colorKey && opts.colorKey + ':fallback');
      lineColors = companies.map(c => brandColor(c, theme) ||
        BRAND_FALLBACK[theme][otherSlots[others.indexOf(c)]] || ink.muted);
    } else {
      const slots = colorSlots(companies, opts.colorKey);
      lineColors = slots.map(k => colors[k] || ink.muted);
    }
    const ink = INK[theme];

    const datasetWithFilters = [];
    const seriesList = [];
    companies.forEach(function (company, i) {
      const datasetId = 'dataset_' + company;
      datasetWithFilters.push({
        id: datasetId,
        fromDatasetId: 'dataset_raw',
        transform: {
          type: 'filter',
          config: { dimension: dimCompany, '=': company },
        },
      });
      seriesList.push({
        type: 'line',
        datasetId: datasetId,
        name: String(company),
        showSymbol: false,

        lineStyle: { width: 2 },
        // Lines past the available colors fall back to a neutral gray.
        color: lineColors[i],
        endLabel: {
          show: true,
          color: ink.text,
          // No label until the company has started (null months).
          formatter: p => (p.value[iVal] == null ? '' : p.value[iEmp] + ': ' + fmt(p.value[iVal])),
        },
        labelLayout: { moveOverlap: 'shiftY' },
        emphasis: { focus: 'series' },
        encode: {
          x: dimTime,
          y: dimValue,
          label: [dimCompany, dimValue],
          itemName: dimTime,
          tooltip: [dimValue],
        },
      });
    });

    return {
      backgroundColor: 'transparent',
      animationDuration: opts.durationMs || RACE_MS,
      dataset: [{ id: 'dataset_raw', source: rawData }].concat(datasetWithFilters),
      color: colors,
      title: {
        text: opts.title || '',
        subtext: (opts.subtitle || 'Argentina \u00b7 Secretar\u00eda de Energ\u00eda') + ' \u00b7 top ' + companies.length + ' ' + (opts.seriesNoun || 'companies'),
        textStyle: { color: ink.text, fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 16 },
        subtextStyle: { color: ink.muted, fontFamily: 'Poppins, sans-serif' },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: ink.muted },
        pageTextStyle: { color: ink.muted },
      },
      tooltip: {
        trigger: 'axis',
        order: 'valueDesc',
        valueFormatter: fmt,
      },
      xAxis: {
        type: 'category',
        data: months,
        nameLocation: 'middle',
        axisLine: { lineStyle: { color: ink.muted } },
        axisLabel: { color: ink.muted },
      },
      // Log scale by default: the leader (YPF) is ~10x most companies and a
      // linear axis flattens them.
      yAxis: {
        type: opts.log === false ? 'value' : 'log',
        // Linear averages: fit the axis to the data instead of forcing zero in.
        scale: opts.log === false,
        logBase: 10,
        name: opts.yAxisName || '',
        nameTextStyle: { color: ink.muted, align: 'left' },
        axisLabel: { color: ink.muted, formatter: v => (v >= 1e6 ? v / 1e6 + ' M' : v >= 1e3 ? v / 1e3 + ' k' : v) },
        splitLine: { lineStyle: { color: ink.grid } },
      },
      grid: { left: 60, right: 250, top: 95, bottom: 50 },
      series: seriesList,
    };
  }

  window.renderLineRace = function (containerId, dataUrl, opts) {
    opts = opts || {};
    const el = document.getElementById(containerId);
    if (!el) return;
    const currentTheme = () => (document.body.classList.contains('dark') ? 'dark' : 'light');

    const data = fetch(dataUrl).then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.json();
    });
    // Fetch in parallel, but draw charts sharing a colorKey in page order so
    // the first one always claims the color slots (deterministic colors).
    const turn = Promise.all([data, drawQueue[opts.colorKey]]).then(([rawData]) => rawData);
    if (opts.colorKey) drawQueue[opts.colorKey] = turn.catch(() => {});

    turn
      .then(rawData => {
        let chart = echarts.init(el);
        let theme = currentTheme();
        const draw = () => chart.setOption(buildOption(rawData, theme, opts), true);
        draw();

        window.addEventListener('resize', () => chart.resize());

        // "Replay" button re-runs the race animation.
        const replay = document.getElementById(containerId + '-replay');
        if (replay) replay.addEventListener('click', () => { chart.clear(); draw(); });

        // Follow the site's light/dark toggle (body.dark).
        new MutationObserver(() => {
          const t = currentTheme();
          if (t !== theme) { theme = t; chart.clear(); draw(); }
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      })
      .catch(err => {
        el.textContent = 'Could not load chart data (' + err.message + ').';
      });
  };
})();
