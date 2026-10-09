// assets/js/energyCharts.js
// Animated ECharts charts for the Argentina drilling/frac post. Needs ECharts
// and assets/js/chartTheme.js loaded first. Data files are built by
// script/process_*.py (see script/energy_charts_data.py).
//
//   renderEnergyChart(kind, containerId, dataUrl, opts)
//
// kinds:
//   'bar-race'      long table [[time, company, value], ...]   (line_race_data.py)
//   'province-map'  {years, values, offshore}  + opts.geoUrl   (province_year_map)
//   'treemap'       {periods, trees, basins}                    (drilldown_tree)
//   'bubbles'       {years, series:[{company, points}]}         (frac_bubbles)
//   'candles'       {indicators:[...]}; dataUrl may be an array (frac_candles,
//                                                                monthly_candles)
//   'radar'         {areas, max, years, values}                 (frac_radar)
//   'calendar'      {years, days:[[date, value]], max}           (frac_calendar)
//   'change-treemap' {year, prev, metrics:{stages, lateral}}     (frac_change_tree)
//   'sankey'        {nodes, links}                              (frac_sankey)

(function () {
  const T = window.MPDChartTheme;
  const { INK, PALETTE, SEQUENTIAL, UPDOWN, NEUTRAL, brandColor, fmtValue, fmtAxis, title } = T;

  const baseText = ink => ({ color: ink.text, fontFamily: 'Poppins, sans-serif' });

  // A year/period timeline, styled to match the site.
  function timeline(labels, ink, opts) {
    return Object.assign({
      axisType: 'category',
      data: labels,
      autoPlay: true,
      loop: false,
      playInterval: 1100,
      bottom: 0,
      left: 30,
      right: 30,
      label: { color: ink.muted, fontSize: 11 },
      lineStyle: { color: ink.grid },
      itemStyle: { color: ink.muted },
      checkpointStyle: { color: PALETTE.light[0], borderColor: ink.surface },
      controlStyle: { color: ink.muted, borderColor: ink.muted },
      progress: { lineStyle: { color: ink.muted }, itemStyle: { color: ink.muted } },
      emphasis: { label: { color: ink.text }, itemStyle: { color: ink.text } },
    }, opts || {});
  }

  // ---------------------------------------------------------------- bar race
  // Frames are pushed with setOption on a timer, as in the ECharts bar-race
  // example; realtimeSort re-orders the bars between frames.
  const barRace = {
    setup(chart, raw, theme, opts) {
      const rows = raw.slice(1);
      const months = Array.from(new Set(rows.map(r => r[0]))).sort();
      const companies = Array.from(new Set(rows.map(r => r[1])));
      const byMonth = {};
      rows.forEach(r => { (byMonth[r[0]] = byMonth[r[0]] || {})[r[1]] = r[2] || 0; });
      const shown = opts.bars || 10;
      const frameMs = opts.frameMs || 120;
      const ink = INK[theme];
      const color = c => brandColor(c, theme) || NEUTRAL[theme];
      const frame = i => {
        const m = months[i];
        return {
          series: [{ data: companies.map(c => ({ value: byMonth[m][c] || 0, itemStyle: { color: color(c) } })) }],
          graphic: [{ id: 'month', style: { text: m } }],
        };
      };
      chart.setOption({
        backgroundColor: 'transparent',
        title: title(opts.title, (opts.subtitle || 'Argentina · Secretaría de Energía') +
          ' · top ' + shown + ' of ' + companies.length + ' companies', ink),
        grid: { left: 10, right: 90, top: 70, bottom: 30, containLabel: true },
        xAxis: { max: 'dataMax', axisLabel: { color: ink.muted, formatter: fmtAxis, showMaxLabel: false },
                 splitLine: { lineStyle: { color: ink.grid } } },
        yAxis: { type: 'category', data: companies, inverse: true, max: shown - 1,
                 animationDuration: 300, animationDurationUpdate: 300,
                 axisLabel: { color: ink.text, fontSize: 11 }, axisLine: { lineStyle: { color: ink.grid } } },
        series: [{ type: 'bar', realtimeSort: true, barMaxWidth: 26,
                   itemStyle: { borderRadius: [0, 4, 4, 0] },
                   label: { show: true, position: 'right', valueAnimation: true, color: ink.text,
                            formatter: p => fmtValue(p.value, opts.unit) },
                   data: [] }],
        tooltip: { trigger: 'item', formatter: p => p.name + ': ' + fmtValue(p.value, opts.unit) },
        animationDuration: 0,
        animationDurationUpdate: frameMs,
        animationEasing: 'linear',
        animationEasingUpdate: 'linear',
        graphic: [{ id: 'month', type: 'text', right: 100, bottom: 50, z: 100,
                    style: Object.assign(baseText(ink), { text: months[0], font: '600 40px Poppins, sans-serif',
                                                          fill: ink.muted, opacity: 0.6 }) }],
      }, true);
      chart.setOption(frame(0));
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        if (i >= months.length) { clearInterval(timer); return; }
        chart.setOption(frame(i));
      }, frameMs);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------ province map
  const provinceMap = {
    setup(chart, data, theme, opts, geo) {
      if (!echarts.getMap('argentina')) echarts.registerMap('argentina', geo);
      const ink = INK[theme];
      const ramp = SEQUENTIAL[theme];
      // Neuquén is an order of magnitude above the rest: fixed log-like bins
      // keep the other provinces readable and the colors comparable by year.
      const bins = opts.bins || [1, 10e3, 50e3, 200e3, 500e3, 1e6, 2e6];
      const pieces = bins.map((lo, k) => {
        const hi = bins[k + 1];
        return {
          min: lo, max: hi, color: ramp[k],
          label: hi ? fmtAxis(lo === 1 ? 0 : lo) + '–' + fmtAxis(hi) : '> ' + fmtAxis(lo),
        };
      });
      const yearLabel = y => (data.partial_year && data.partial_year.startsWith(y) ? data.partial_year : y);
      chart.setOption({
        baseOption: {
          backgroundColor: 'transparent',
          timeline: timeline(data.years.map(yearLabel), ink),
          tooltip: { trigger: 'item',
                     formatter: p => p.name + ': ' + (p.value > 0 ? fmtValue(p.value, data.unit) : 'no drilling') },
          visualMap: { type: 'piecewise', pieces, left: 10, bottom: 70, itemWidth: 14, itemHeight: 10, showLabel: true,
                       textStyle: { color: ink.muted, fontSize: 11 }, outOfRange: { color: ink.grid },
                       text: [opts.legendTitle || 'Meters drilled', ''] },
          series: [{ type: 'map', map: 'argentina', roam: false, top: 70, bottom: 60, left: 'center',
                     aspectScale: 0.85, nameProperty: 'name',
                     itemStyle: { areaColor: ink.grid, borderColor: ink.surface, borderWidth: 1 },
                     emphasis: { label: { show: true, color: ink.text },
                                 itemStyle: { areaColor: PALETTE[theme][3] } },
                     select: { disabled: true },
                     label: { show: false } }],
        },
        options: data.years.map(y => ({
          title: title(opts.title, yearLabel(y) + (data.offshore[y] > 0
            ? ' · offshore (federal waters, not on the map): ' + fmtValue(data.offshore[y], data.unit) : ''), ink),
          series: [{ data: data.values[y] }],
        })),
      }, true);
    },
  };

  // ------------------------------------------------------- drill-down treemap
  const treemap = {
    setup(chart, data, theme, opts) {
      const ink = INK[theme];
      const basinColor = {};
      data.basins.forEach((b, k) => {
        basinColor[b] = b === 'Other basins' ? NEUTRAL[theme] : PALETTE[theme][k % PALETTE[theme].length];
      });
      const colorize = nodes => nodes.map(n => Object.assign({}, n, { itemStyle: { color: basinColor[n.name] } }));
      const short = p => (p.startsWith('All') ? 'All' : p);
      chart.setOption({
        baseOption: {
          backgroundColor: 'transparent',
          timeline: timeline(data.periods.map(short), ink, { autoPlay: false }),
          tooltip: {
            formatter: info => {
              const path = info.treePathInfo.slice(1).map(n => n.name).join(' › ');
              const parent = info.treePathInfo[info.treePathInfo.length - 2];
              const share = parent && parent.value ? ' (' + Math.round(100 * info.value / parent.value) + '% of ' +
                (parent.name || 'total') + ')' : '';
              return path + '<br>' + fmtValue(info.value, data.unit) + share;
            },
          },
          series: [{
            type: 'treemap', top: 104, bottom: 60, left: 0, right: 0,
            leafDepth: 2, roam: false, nodeClick: 'zoomToNode', name: 'All basins',
            breadcrumb: { top: 70, left: 0, itemStyle: { color: ink.grid, textStyle: { color: ink.text } } },
            label: { color: '#ffffff', fontSize: 11, overflow: 'truncate' },
            upperLabel: { show: true, height: 22, color: '#ffffff', fontWeight: 600 },
            itemStyle: { borderColor: ink.surface },
            levels: [
              { itemStyle: { borderWidth: 0, gapWidth: 3 }, upperLabel: { show: false } },
              { itemStyle: { gapWidth: 2, borderColorSaturation: 0.6 }, colorSaturation: [0.35, 0.6] },
              { itemStyle: { gapWidth: 1, borderColorSaturation: 0.7 }, colorSaturation: [0.3, 0.6] },
            ],
          }],
        },
        options: data.periods.map(p => ({
          title: title(opts.title, (data.partial_year && data.partial_year.startsWith(p) ? data.partial_year : p) +
            ' · click a tile to drill down', ink),
          series: [{ data: colorize(data.trees[p]) }],
        })),
      }, true);
    },
  };

  // ------------------------------------------------- Gapminder-style bubbles
  const bubbles = {
    setup(chart, data, theme, opts) {
      const ink = INK[theme];
      const all = [];
      data.series.forEach(s => Object.values(s.points).forEach(p => all.push(p)));
      const maxWells = Math.max.apply(null, all.map(p => p[2]));
      const pad = (lo, hi) => [Math.max(0, Math.floor(lo * 0.9 / 500) * 500), Math.ceil(hi * 1.05 / 500) * 500];
      const [xMin, xMax] = pad(Math.min.apply(null, all.map(p => p[0])), Math.max.apply(null, all.map(p => p[0])));
      const yMax = Math.ceil(Math.max.apply(null, all.map(p => p[1])) * 1.1 / 10) * 10;
      const size = w => 8 + 52 * Math.sqrt(w / maxWells);   // area ~ wells
      const yearLabel = y => (data.partial_year && data.partial_year.startsWith(y) ? data.partial_year : y);
      const color = (c, k) => brandColor(c, theme) || PALETTE[theme][k % PALETTE[theme].length];
      chart.setOption({
        baseOption: {
          backgroundColor: 'transparent',
          timeline: timeline(data.years.map(yearLabel), ink),
          legend: { top: 52, left: 'center', textStyle: { color: ink.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
          grid: { left: 60, right: 30, top: 110, bottom: 80 },
          tooltip: {
            formatter: p => p.seriesName + ' · ' + yearLabel(p.value[3]) +
              '<br>Avg lateral: ' + fmtValue(p.value[0], 'm') +
              '<br>Avg stages per well: ' + p.value[1] +
              '<br>Horizontal wells fractured: ' + p.value[2],
          },
          xAxis: { type: 'value', name: 'Average lateral length per well (m)', nameLocation: 'middle', nameGap: 28,
                   min: xMin, max: xMax, nameTextStyle: { color: ink.muted },
                   axisLabel: { color: ink.muted }, splitLine: { lineStyle: { color: ink.grid } } },
          yAxis: { type: 'value', name: 'Average frac stages per well', min: 0, max: yMax,
                   nameTextStyle: { color: ink.muted, align: 'left' },
                   axisLabel: { color: ink.muted }, splitLine: { lineStyle: { color: ink.grid } } },
          graphic: [{ id: 'year', type: 'text', right: 40, bottom: 100, z: 0,
                      style: { text: '', font: '600 56px Poppins, sans-serif', fill: ink.muted, opacity: 0.25 } }],
          animationDurationUpdate: 1000,
          animationEasingUpdate: 'quinticInOut',
          series: data.series.map((s, k) => ({
            type: 'scatter', name: s.company,
            itemStyle: { color: color(s.company, k), opacity: 0.85, borderColor: ink.surface, borderWidth: 2 },
            symbolSize: v => size(v[2]),
            label: { show: true, position: 'right', color: ink.text, fontSize: 11, formatter: p => p.seriesName },
            labelLayout: { hideOverlap: true },
            emphasis: { focus: 'series' },
          })),
        },
        options: data.years.map(y => ({
          graphic: [{ id: 'year', style: { text: yearLabel(y) } }],
          title: title(opts.title, (opts.subtitle || 'Horizontal wells · bubble size = wells fractured') +
            ' · ' + yearLabel(y), ink),
          series: data.series.map(s => ({ data: s.points[y] ? [s.points[y].concat([y])] : [] })),
        })),
      }, true);
    },
  };

  // --------------------------------------------------------- activity candles
  // Candle per month: open = previous month, close = this month (blue = up,
  // orange = down). Lower panel: the month-over-month change, +/-.
  const candles = {
    setup(chart, data, theme, opts, extra, el) {
      const ink = INK[theme];
      const ud = UPDOWN[theme];
      const indicators = data.indicators;
      let pick = Math.max(0, indicators.findIndex(i => i.key === opts.defaultIndicator));

      // Indicator picker, built once next to the chart.
      let select = document.getElementById(el.id + '-indicator');
      if (!select) {
        select = document.createElement('select');
        select.id = el.id + '-indicator';
        select.setAttribute('aria-label', 'Activity indicator');
        select.style.cssText = 'font:14px Poppins,sans-serif;padding:4px 8px;margin:0 0 8px 0;border:1px solid #A4A3A8;' +
          'border-radius:6px;background:transparent;color:inherit;';
        indicators.forEach((ind, k) => {
          const o = document.createElement('option');
          o.value = k; o.textContent = ind.name;
          select.appendChild(o);
        });
        el.parentNode.insertBefore(select, el);
      }
      select.value = String(pick);

      const draw = () => {
        const ind = indicators[pick];
        const n = ind.months.length;
        const start = opts.zoomMonths ? Math.max(0, 100 * (1 - opts.zoomMonths / n)) : 0;
        const wicks = ind.wicks ? 'wicks = lowest/highest ' + ind.wicks + ' in the month' : 'monthly data, no wicks';
        chart.setOption({
          backgroundColor: 'transparent',
          title: title(ind.name, 'Each candle: previous month → this month · ' + wicks +
            ' · ' + ind.source, ink),
          legend: { top: 52, right: 10, data: ['12-month average'], textStyle: { color: ink.muted, fontSize: 11 } },
          tooltip: {
            trigger: 'axis', axisPointer: { type: 'cross' },
            formatter: ps => {
              const k = ps[0].dataIndex;
              const [o, c, l, h] = ind.ohlc[k];
              const chg = ind.change[k];
              const pct = o ? ' (' + (chg >= 0 ? '+' : '') + Math.round(100 * chg / o) + '%)' : '';
              return ind.months[k] + '<br>Previous month: ' + fmtValue(o, ind.unit) +
                '<br>This month: ' + fmtValue(c, ind.unit) +
                '<br>Change: ' + (chg >= 0 ? '+' : '') + fmtValue(chg, ind.unit) + pct +
                (ind.wicks ? '<br>Weekly pace range: ' + fmtValue(l, ind.unit) + ' – ' + fmtValue(h, ind.unit) : '') +
                (ind.ma12[k] != null ? '<br>12-month average: ' + fmtValue(ind.ma12[k], ind.unit) : '');
            },
          },
          axisPointer: { link: [{ xAxisIndex: 'all' }] },
          grid: [{ left: 60, right: 20, top: 85, height: '50%' },
                 { left: 60, right: 20, top: '72%', height: '14%' }],
          xAxis: [0, 1].map(g => ({
            type: 'category', data: ind.months, gridIndex: g, boundaryGap: true,
            axisLine: { lineStyle: { color: ink.grid } },
            axisLabel: { show: g === 1, color: ink.muted }, axisTick: { show: false },
          })),
          yAxis: [
            { scale: true, gridIndex: 0, axisLabel: { color: ink.muted, formatter: fmtAxis },
              splitLine: { lineStyle: { color: ink.grid } } },
            { gridIndex: 1, name: 'Change', nameTextStyle: { color: ink.muted, align: 'left' },
              axisLabel: { color: ink.muted, formatter: fmtAxis }, splitNumber: 2,
              splitLine: { lineStyle: { color: ink.grid } } },
          ],
          dataZoom: [
            { type: 'inside', xAxisIndex: [0, 1], start, end: 100 },
            { type: 'slider', xAxisIndex: [0, 1], start, end: 100, bottom: 8, height: 18,
              textStyle: { color: ink.muted }, borderColor: ink.grid },
          ],
          animationDuration: 1500,
          series: [
            { type: 'candlestick', name: ind.name, data: ind.ohlc,
              itemStyle: { color: ud.up, color0: ud.down, borderColor: ud.up, borderColor0: ud.down } },
            { type: 'line', name: '12-month average', data: ind.ma12, showSymbol: false, smooth: true,
              lineStyle: { width: 2, color: ink.muted }, itemStyle: { color: ink.muted } },
            { type: 'bar', name: 'Change', xAxisIndex: 1, yAxisIndex: 1,
              data: ind.change.map(v => ({ value: v, itemStyle: { color: v >= 0 ? ud.up : ud.down } })) },
          ],
        }, true);
      };
      select.onchange = () => { pick = Number(select.value); draw(); };
      draw();
    },
  };

  // ------------------------------------------------------------------- radar
  // Wells fractured per main area, one polygon per year (previous year faint).
  const radar = {
    setup(chart, data, theme, opts) {
      const ink = INK[theme];
      const top = Math.max.apply(null, data.max);
      const max = Math.ceil(top * 1.1 / 10) * 10;
      const yearLabel = y => (data.partial_year && data.partial_year.startsWith(y) ? data.partial_year : y);
      const main = PALETTE[theme][0];
      chart.setOption({
        baseOption: {
          backgroundColor: 'transparent',
          timeline: timeline(data.years.map(yearLabel), ink),
          legend: { top: 52, left: 'center', textStyle: { color: ink.muted, fontSize: 11 } },
          tooltip: { trigger: 'item' },
          radar: {
            center: ['50%', '55%'], radius: '62%', splitNumber: 4,
            indicator: data.areas.map(a => ({ name: a, max })),
            axisName: { color: ink.text, fontSize: 11 },
            splitLine: { lineStyle: { color: ink.grid } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: ink.grid } },
          },
          animationDurationUpdate: 900,
          series: [{ type: 'radar', symbolSize: 5 }],
        },
        options: data.years.map((y, k) => {
          const items = [];
          if (k > 0) {
            items.push({ name: yearLabel(data.years[k - 1]), value: data.values[data.years[k - 1]],
                         lineStyle: { color: ink.muted, type: 'dashed', width: 1 },
                         itemStyle: { color: ink.muted }, areaStyle: { opacity: 0 } });
          }
          items.push({ name: yearLabel(y), value: data.values[y], lineStyle: { color: main, width: 2 },
                       itemStyle: { color: main }, areaStyle: { color: main, opacity: 0.2 } });
          return {
            title: title(opts.title, 'Horizontal wells fractured per area · ' + yearLabel(y) +
              (k > 0 ? ' (dashed: ' + yearLabel(data.years[k - 1]) + ')' : ''), ink),
            legend: { data: items.map(i => i.name) },
            series: [{ data: items }],
          };
        }),
      }, true);
    },
  };

  // -------------------------------------------------------- calendar heatmap
  const calendar = {
    setup(chart, data, theme, opts) {
      const ink = INK[theme];
      const years = data.years;
      const top = 95;
      const each = opts.calendarHeight || 150;
      chart.setOption({
        backgroundColor: 'transparent',
        title: title(opts.title, 'Frac stages pumped per day (each well’s stages spread over its frac job) · data to ' +
          data.last_date, ink),
        tooltip: { formatter: p => p.value[0] + ': ' + fmtValue(p.value[1], data.unit) },
        visualMap: { min: 0, max: data.max, calculable: true, orient: 'horizontal', left: 'center', top: 52,
                     itemHeight: 220, itemWidth: 12, inRange: { color: SEQUENTIAL[theme].slice(0, 6) },
                     text: ['', ''], textStyle: { color: ink.muted, fontSize: 11 },
                     formatter: v => Math.round(v) },
        calendar: years.map((y, k) => ({
          range: y, top: top + k * each, left: 50, right: 10, cellSize: ['auto', 15],
          orient: 'horizontal', splitLine: { lineStyle: { color: ink.muted, width: 1 } },
          itemStyle: { color: ink.surface, borderColor: ink.grid, borderWidth: 1 },
          yearLabel: { color: ink.text, fontSize: 14, margin: 30 },
          monthLabel: { color: ink.muted, fontSize: 11 },
          dayLabel: { color: ink.muted, fontSize: 10, firstDay: 1, nameMap: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] },
        })),
        series: years.map((y, k) => ({
          type: 'heatmap', coordinateSystem: 'calendar', calendarIndex: k,
          data: data.days.filter(d => d[0].startsWith(y)),
        })),
        animationDuration: 1200,
      }, true);
    },
  };

  // ------------------------------------- change treemap (ECharts "Obama" style)
  // Tile size = last full year; color = change vs. the previous year
  // (orange = down, gray = flat, blue = up). The legend switches metric.
  const changeTree = {
    setup(chart, data, theme, opts) {
      const ink = INK[theme];
      const ud = UPDOWN[theme];
      const span = opts.changeRange || 60;
      const metrics = [['stages', 'Frac stages'], ['lateral', 'Lateral length']];
      // A new area (nothing the previous year) shows as the strongest growth.
      const prep = nodes => nodes.map(n => {
        const v = n.value.slice();
        if (v[2] == null) v[2] = span;
        const out = { name: n.name, value: v, raw: n.value };
        if (n.children) out.children = prep(n.children);
        return out;
      });
      const tip = (info, unit) => {
        const [cur, prev, pct] = info.data.raw || info.value;
        return info.treePathInfo.slice(1).map(n => n.name).join(' › ') +
          '<br>' + data.year + ': ' + fmtValue(cur, unit) +
          '<br>' + data.prev + ': ' + fmtValue(prev, unit) +
          '<br>Change: ' + (pct == null ? 'new' : (pct >= 0 ? '+' : '') + pct + '%');
      };
      chart.setOption({
        backgroundColor: 'transparent',
        title: title(opts.title, data.year + ' vs. ' + data.prev + ' · size = ' + data.year +
          ' total · color = change (orange down, blue up, capped at ±' + span + '%)', ink),
        legend: { top: 52, left: 'center', selectedMode: 'single', data: metrics.map(m => m[1]),
                  textStyle: { color: ink.text }, itemStyle: { color: ink.muted } },
        tooltip: {},
        series: metrics.map(([key, label]) => {
          const m = data.metrics[key];
          return {
            type: 'treemap', name: label, top: 85, bottom: 10, left: 0, right: 0, roam: false,
            nodeClick: false, breadcrumb: { show: false },
            visualDimension: 2, visualMin: -span, visualMax: span,
            color: [ud.down, NEUTRAL[theme], ud.up], colorMappingBy: 'value',
            tooltip: { formatter: info => tip(info, m.unit) },
            label: { color: '#ffffff', fontSize: 11, overflow: 'truncate',
                     formatter: p => p.name + '\n' + (p.data.raw && p.data.raw[2] == null ? 'new'
                       : ((p.value[2] >= 0 ? '+' : '') + Math.round(p.value[2]) + '%')) },
            upperLabel: { show: true, height: 22, color: ink.text, fontWeight: 600 },
            itemStyle: { borderColor: ink.surface },
            levels: [
              { itemStyle: { borderWidth: 3, borderColor: ink.surface, gapWidth: 3 },
                color: [ud.down, NEUTRAL[theme], ud.up], colorMappingBy: 'value', visualDimension: 2,
                visualMin: -span, visualMax: span },
              { itemStyle: { gapWidth: 1 },
                color: [ud.down, NEUTRAL[theme], ud.up], colorMappingBy: 'value', visualDimension: 2,
                visualMin: -span, visualMax: span },
            ],
            data: prep(m.tree),
          };
        }),
      }, true);
    },
  };

  // ------------------------------------------------------------------ sankey
  const sankey = {
    setup(chart, data, theme, opts) {
      const ink = INK[theme];
      let k = 0;
      const nodes = data.nodes.map(n => ({
        name: n.name,
        itemStyle: { color: n.kind === 'company'
          ? (brandColor(n.name, theme) || T.BRAND_FALLBACK[theme][k++ % 3])
          : ink.muted, borderColor: ink.surface },
        label: { color: ink.text, fontSize: 11 },
      }));
      chart.setOption({
        backgroundColor: 'transparent',
        title: title(opts.title, 'Total frac stages ' + data.period + ' · company → area', ink),
        tooltip: { trigger: 'item',
                   formatter: p => (p.dataType === 'edge'
                     ? p.data.source + ' → ' + p.data.target + ': ' + fmtValue(p.data.value, data.unit)
                     : p.name + ': ' + fmtValue(p.value, data.unit)) },
        series: [{
          type: 'sankey', top: 70, bottom: 10, left: 10, right: 150, nodeWidth: 14, nodeGap: 8,
          layoutIterations: 64, draggable: false, emphasis: { focus: 'adjacency' },
          lineStyle: { color: 'source', opacity: 0.35, curveness: 0.5 },
          data: nodes, links: data.links,
        }],
        animationDuration: 1500,
      }, true);
    },
  };

  const KINDS = { 'bar-race': barRace, 'province-map': provinceMap, treemap, bubbles, candles,
                  radar, calendar, 'change-treemap': changeTree, sankey };

  // Candle data may come from several files: their indicators are concatenated.
  function load(dataUrl) {
    if (!Array.isArray(dataUrl)) return T.fetchJson(dataUrl);
    return Promise.all(dataUrl.map(T.fetchJson)).then(parts =>
      ({ indicators: parts.reduce((acc, p) => acc.concat(p.indicators), []) }));
  }

  window.renderEnergyChart = function (kind, containerId, dataUrl, opts) {
    opts = opts || {};
    const el = document.getElementById(containerId);
    const impl = KINDS[kind];
    if (!el || !impl) return;
    const extra = opts.geoUrl ? T.fetchJson(opts.geoUrl) : Promise.resolve(null);
    Promise.all([load(dataUrl), extra])
      .then(([data, extraData]) => {
        const chart = echarts.init(el);
        let theme = T.currentTheme();
        let stop = null;
        const draw = () => {
          if (stop) stop();
          chart.clear();
          stop = impl.setup(chart, data, theme, opts, extraData, el) || null;
        };
        draw();
        window.addEventListener('resize', () => chart.resize());
        const replay = document.getElementById(containerId + '-replay');
        if (replay) replay.addEventListener('click', draw);
        T.onThemeChange(t => { theme = t; draw(); });
      })
      .catch(err => { el.textContent = 'Could not load chart data (' + err.message + ').'; });
  };
})();
