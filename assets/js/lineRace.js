// assets/js/lineRace.js
// ECharts "line race" of a cumulative value per company over time.
// Based on https://echarts.apache.org/examples/en/editor.html?c=line-race
// Data: a long-format JSON table [[time, company, value], ...] with a header
// row, as written by script/line_race_data.py (null = company not started yet).
//
// Usage:
//   renderLineRace('metros-line-race', '/data/processed/metros_perforados_cumsum.json', {
//     title: 'Cumulative meters drilled by company',
//     yAxisName: 'Cumulative meters (log scale)',
//     unit: 'm',
//   });

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

  // Company brand colors (opts.brandColors), matched on the line label:
  // [pattern, light-mode color, dark-mode color]. Dark variants are lighter
  // only where the brand color would disappear on the dark background.
  // Sources: Shell and Sinopec published colors; YPF #0063C2 (2017 logo,
  // third-party); Vista #414042 (Brandfetch); TotalEnergies orange from its
  // seven-color palette (its red would clash with Sinopec); Tecpetrol dark
  // green approximated from its trademark (green/blue bands, no published
  // hex); Pampa Energía #1ED760 (Brandfetch, unconfirmed).
  // TODO: Pan American Energy, Pluspetrol and CAPEX have no confirmed brand
  // color yet; they fall back to BRAND_FALLBACK below.
  const BRAND_COLORS = [
    [/^YPF\b/, '#0063C2', '#3D8BE0'],
    [/^SHELL\b/, '#FBCE07', '#FBCE07'],
    [/^(SINO|SINOPEC)\b/, '#ED1C24', '#F0454B'],
    [/^TOTAL\b/, '#FF7800', '#FF7800'],
    [/^(VST|VISTA)\b/, '#414042', '#A7A9AC'],
    [/^TECPETROL\b/, '#00843D', '#2BA562'],
    [/^PAMPA\b/, '#1ED760', '#1ED760'],
  ];
  // Non-brand colors for companies without a brand entry: hues no brand above
  // uses (violet, magenta, aqua), so they never read as someone's brand.
  const BRAND_FALLBACK = {
    light: ['#4a3aa7', '#e87ba4', '#1baf7a'],
    dark:  ['#9085e9', '#d55181', '#199e70'],
  };

  function brandColor(company, theme) {
    const hit = BRAND_COLORS.find(([re]) => re.test(String(company).toUpperCase()));
    return hit ? (theme === 'dark' ? hit[2] : hit[1]) : null;
  }

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

  // 1234567 -> "1.23 M m"; 45678 -> "45.7 k m"
  function fmtValue(v, unit) {
    const u = unit ? ' ' + unit : '';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + ' M' + u;
    if (v >= 1e3) return (v / 1e3).toFixed(1) + ' k' + u;
    return Math.round(v) + u;
  }

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
      .sort((a, b) => b[iVal] - a[iVal])
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
