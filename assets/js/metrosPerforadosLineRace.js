// assets/js/metrosPerforadosLineRace.js
// ECharts "line race" of cumulative meters drilled per company (Argentina).
// Based on https://echarts.apache.org/examples/en/editor.html?c=line-race
// Data: data/processed/metros_perforados_cumsum.json, built by
// script/process_metros_perforados.py as [["mes","empresa","metros_acumulados"], ...]
//
// Usage: renderMetrosLineRace('metros-line-race', '/data/processed/metros_perforados_cumsum.json');

(function () {
  // Fixed categorical order (never cycled): one slot per company, by final rank.
  const PALETTE = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    dark:  ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  };
  const INK = {
    light: { text: '#151515', muted: '#757575', grid: '#e4e3e3', surface: '#F8F7F7' },
    dark:  { text: '#F8F7F7', muted: '#A4A3A8', grid: '#2e2e2e', surface: '#151515' },
  };
  const RACE_MS = 12000;

  // 1234567 -> "1.23 M m"; 45678 -> "45.7 k m"
  function fmtMeters(v) {
    if (v >= 1e6) return (v / 1e6).toFixed(2) + ' M m';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + ' k m';
    return Math.round(v) + ' m';
  }

  function buildOption(rawData, theme) {
    const header = rawData[0];
    const iMes = header.indexOf('mes');
    const iEmp = header.indexOf('empresa');
    const iVal = header.indexOf('metros_acumulados');
    const rows = rawData.slice(1);

    // Companies ordered by final cumulative meters -> stable color slots.
    const lastMes = rows.reduce((m, r) => (r[iMes] > m ? r[iMes] : m), '');
    const companies = rows
      .filter(r => r[iMes] === lastMes)
      .sort((a, b) => b[iVal] - a[iVal])
      .map(r => r[iEmp]);

    // Companies start on different months, so give the axis every month.
    const months = Array.from(new Set(rows.map(r => r[iMes]))).sort();

    const colors = PALETTE[theme];
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
          config: { dimension: 'empresa', '=': company },
        },
      });
      seriesList.push({
        type: 'line',
        datasetId: datasetId,
        name: String(company),
        showSymbol: false,
        lineStyle: { width: 2 },
        // Companies past the 8 categorical slots fall back to a neutral gray.
        color: colors[i] || ink.muted,
        endLabel: {
          show: true,
          color: ink.text,
          // No label until the company has drilled (null months).
          formatter: p => (p.value[iVal] == null ? '' : p.value[iEmp] + ': ' + fmtMeters(p.value[iVal])),
        },
        labelLayout: { moveOverlap: 'shiftY' },
        emphasis: { focus: 'series' },
        encode: {
          x: 'mes',
          y: 'metros_acumulados',
          label: ['empresa', 'metros_acumulados'],
          itemName: 'mes',
          tooltip: ['metros_acumulados'],
        },
      });
    });

    return {
      backgroundColor: 'transparent',
      animationDuration: RACE_MS,
      dataset: [{ id: 'dataset_raw', source: rawData }].concat(datasetWithFilters),
      color: colors,
      title: {
        text: 'Cumulative meters drilled by company',
        subtext: 'Argentina \u00b7 Secretar\u00eda de Energ\u00eda \u00b7 top ' + companies.length + ' companies',
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
        valueFormatter: fmtMeters,
      },
      xAxis: {
        type: 'category',
        data: months,
        nameLocation: 'middle',
        axisLine: { lineStyle: { color: ink.muted } },
        axisLabel: { color: ink.muted },
      },
      // Log scale: YPF is ~10x most companies; a linear axis flattens them.
      yAxis: {
        type: 'log',
        logBase: 10,
        name: 'Cumulative meters (log scale)',
        nameTextStyle: { color: ink.muted, align: 'left' },
        axisLabel: { color: ink.muted, formatter: v => (v >= 1e6 ? v / 1e6 + ' M' : v >= 1e3 ? v / 1e3 + ' k' : v) },
        splitLine: { lineStyle: { color: ink.grid } },
      },
      grid: { left: 60, right: 240, top: 95, bottom: 50 },
      series: seriesList,
    };
  }

  window.renderMetrosLineRace = function (containerId, dataUrl) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const currentTheme = () => (document.body.classList.contains('dark') ? 'dark' : 'light');

    fetch(dataUrl)
      .then(r => {
        if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
        return r.json();
      })
      .then(rawData => {
        let chart = echarts.init(el);
        let theme = currentTheme();
        const draw = () => chart.setOption(buildOption(rawData, theme), true);
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
        el.textContent = 'Could not load drilling data (' + err.message + ').';
      });
  };
})();
