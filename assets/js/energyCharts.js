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
//   'wells-map'     {years, areas, wells} + opts.geoUrl = [provinces, concessions]
//                                                               (process_produccion.py)
//   'vm-blocks'     {blocks, contracts, ...} + opts.geoUrl = [provinces, neuquen-areas]
//                                                               (process_neuquen_areas.py)

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
      const operator = {};   // optional 4th column: who operates the bar's area
      rows.forEach(r => {
        (byMonth[r[0]] = byMonth[r[0]] || {})[r[1]] = r[2] || 0;
        if (r[3]) operator[r[1]] = r[3];
      });
      const shown = opts.bars || 10;
      const frameMs = opts.frameMs || 120;
      const ink = INK[theme];
      const color = c => brandColor(operator[c] || c, theme) || NEUTRAL[theme];
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
          ' · top ' + shown + ' of ' + companies.length + ' ' + (opts.seriesNoun || 'companies') +
          (Object.keys(operator).length ? ' · colored by main operator' : ''), ink),
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
        tooltip: { trigger: 'item', formatter: p => p.name + (operator[p.name] ? ' (' + operator[p.name] + ')' : '') +
          ': ' + fmtValue(p.value, opts.unit) },
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
      // Color each tile from its % change on a fixed diverging scale
      // (orange -span% .. gray 0 .. blue +span%). A new area (nothing the
      // previous year) shows as the strongest growth.
      const scale = [ud.down, NEUTRAL[theme], ud.up];
      const colorOf = pct => {
        const p = pct == null ? span : Math.max(-span, Math.min(span, pct));
        return echarts.color.lerp((p + span) / (2 * span), scale);
      };
      const prep = nodes => nodes.map(n => {
        const out = { name: n.name, value: n.value, raw: n.value,
                      itemStyle: { color: colorOf(n.value[2]) } };
        if (n.children) out.children = prep(n.children);
        return out;
      });
      const tip = (info, unit) => {
        const raw = (info.data && info.data.raw) || info.value;
        if (!Array.isArray(raw)) return info.name;
        const [cur, prev, pct] = raw;
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
            tooltip: { formatter: info => tip(info, m.unit) },
            label: { color: '#ffffff', fontSize: 11, overflow: 'truncate',
                     formatter: p => {
                       const raw = p.data && p.data.raw;
                       if (!raw) return p.name;
                       return p.name + '\n' + (raw[2] == null ? 'new'
                         : (raw[2] >= 0 ? '+' : '') + Math.round(raw[2]) + '%');
                     } },
            upperLabel: { show: true, height: 22, color: ink.text, fontWeight: 600 },
            itemStyle: { borderColor: ink.surface },
            levels: [
              { itemStyle: { borderWidth: 3, borderColor: ink.surface, gapWidth: 3 } },
              { itemStyle: { gapWidth: 1 } },
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

  // -------------------------------------------- wells over concession areas
  // Choropleth: wells drilled since the first year, cumulative, per concession
  // area. Dots: the wells themselves (faint = earlier years, bright = drilled
  // in the selected year), blue = conventional, orange = unconventional.
  const wellsMap = {
    setup(chart, data, theme, opts, geos) {
      const ink = INK[theme];
      const ramp = SEQUENTIAL[theme];
      if (!echarts.getMap('ar-concesiones')) {
        // Provinces first (background outlines), then the concession areas.
        const [prov, conc] = geos;
        const feats = prov.features.map(f => Object.assign({}, f, { properties: { name: 'prov:' + f.properties.name } }))
          .concat(conc.features);
        echarts.registerMap('ar-concesiones', { type: 'FeatureCollection', features: feats });
      }
      const provRegions = geos[0].features.map(f => ({
        name: 'prov:' + f.properties.name, silent: true,
        itemStyle: { areaColor: 'transparent', borderColor: ink.muted, borderWidth: 1 },
        emphasis: { disabled: true }, label: { show: false },
      }));
      const bins = opts.bins || [1, 10, 50, 100, 250, 500];
      const pieces = bins.map((lo, k) => {
        const hi = bins[k + 1];
        return { min: lo, max: hi ? hi - 1 : undefined, color: ramp[k + 1] || ramp[ramp.length - 1],
                 label: hi ? lo + '–' + (hi - 1) : lo + '+' };
      });
      const typeColor = [PALETTE[theme][0], PALETTE[theme][1], ink.muted];
      const yearLabel = y => (data.partial_year && data.partial_year.startsWith(y) ? data.partial_year : y);
      const dots = (y, current) => data.types.map((t, k) => data.wells
        .filter(w => w[3] === k && (current ? String(w[2]) === y : String(w[2]) < y))
        .map(w => [w[0], w[1]]));
      const scatter = (name, k, current) => ({
        type: 'scatter', coordinateSystem: 'geo', geoIndex: 0, name, large: !current, silent: !current,
        symbolSize: current ? 4 : 2,
        itemStyle: { color: typeColor[k], opacity: current ? 0.95 : 0.3 },
        tooltip: { show: false }, z: current ? 4 : 3,
      });
      chart.setOption({
        baseOption: {
          backgroundColor: 'transparent',
          timeline: timeline(data.years.map(yearLabel), ink, { z: 20 }),
          legend: { top: 52, left: 'center', textStyle: { color: ink.muted, fontSize: 11 }, z: 20,
                    data: ['Conventional', 'Unconventional'] },
          tooltip: { trigger: 'item',
                     formatter: p => (p.seriesType === 'map' && !String(p.name).startsWith('prov:')
                       ? p.name + ': ' + (p.value > 0 ? p.value + ' wells' : 'no wells') : '') },
          geo: {
            map: 'ar-concesiones', roam: true, top: 130, bottom: 60,
            center: opts.center || [-68.9, -38.2], zoom: opts.zoom || 5, scaleLimit: { min: 1, max: 40 },
            itemStyle: { areaColor: ink.surface, borderColor: ink.grid, borderWidth: 0.5 },
            emphasis: { itemStyle: { areaColor: PALETTE[theme][3] }, label: { show: false } },
            select: { disabled: true },
            regions: provRegions,
          },
          visualMap: { type: 'piecewise', pieces, seriesIndex: 0, left: 10, bottom: 70, showLabel: true,
                       itemWidth: 14, itemHeight: 10, text: ['Wells per area', ''], z: 20, padding: 6,
                       backgroundColor: ink.surface, textStyle: { color: ink.muted, fontSize: 11 } },
          // ECharts does not clip a zoomed map to its box: solid bands above
          // and below keep the outlines off the title, legend and timeline.
          graphic: [
            { type: 'rect', left: 0, top: 0, z: 10, silent: true,
              shape: { width: 4000, height: 128 }, style: { fill: ink.surface } },
            { type: 'rect', left: 0, bottom: 0, z: 10, silent: true,
              shape: { width: 4000, height: 60 }, style: { fill: ink.surface } },
          ],
          series: [
            { type: 'map', map: 'ar-concesiones', geoIndex: 0, name: 'Wells per area' },
            scatter('Conventional', 0, false), scatter('Unconventional', 1, false),
            scatter('Conventional', 0, true), scatter('Unconventional', 1, true),
          ],
        },
        options: data.years.map(y => {
          const before = dots(y, false);
          const now = dots(y, true);
          return {
            title: Object.assign(title(opts.title, 'Wells drilled ' + data.years[0] + '–' + yearLabel(y) +
              ' · bright dots: drilled in ' + yearLabel(y) + ' (' + (now[0].length + now[1].length) + ')', ink), { z: 20 }),
            series: [{ data: data.areas[y] }, { data: before[0] }, { data: before[1] }, { data: now[0] }, { data: now[1] }],
          };
        }),
      }, true);
    },
  };

  // ------------------------------------------------ Vaca Muerta block map
  // Neuquén blocks (provincial GeoServer) colored by the selected view:
  // operator (brand colors), contract type, or a per-block metric. The Vaca
  // Muerta fluid windows are drawn on top as colored outlines.
  const vmBlocks = {
    setup(chart, data, theme, opts, geos, el) {
      const ink = INK[theme];
      const ramp = SEQUENTIAL[theme];
      const [prov, nqn] = geos;
      const windows = nqn.windows || [];
      if (!echarts.getMap('nqn-blocks')) {
        const feats = prov.features.map(f => Object.assign({}, f, { properties: { name: 'prov:' + f.properties.name } }))
          .concat(nqn.features, windows);
        echarts.registerMap('nqn-blocks', { type: 'FeatureCollection', features: feats });
      }
      const blocks = data.blocks;
      const fmtInt = v => (v ? Math.round(v).toLocaleString('en-US') : '0');
      const binColor = (v, bins) => {
        if (!v) return ink.surface;
        let k = 0;
        while (k < bins.length - 1 && v >= bins[k + 1]) k++;
        return ramp[Math.min(ramp.length - 1, k + 1)];
      };
      const binLegend = (bins, unit) => bins.map((lo, k) => ({
        color: ramp[Math.min(ramp.length - 1, k + 1)],
        label: (k === bins.length - 1 ? '> ' + fmtValue(lo, '') : fmtValue(lo, '') + '–' + fmtValue(bins[k + 1], '')) + ' ' + unit,
      })).concat([{ color: ink.surface, label: 'none' }]);

      const contractColor = {
        'Unconventional concession': PALETTE[theme][0], 'Conventional concession': PALETTE[theme][2],
        'Exploration permit': PALETTE[theme][3], 'No contract / reverted': NEUTRAL[theme], Other: ink.grid,
      };
      const operatorColor = b => (b.contract === 'No contract / reverted' ? ink.surface
        : brandColor(b.operator || '', theme) || NEUTRAL[theme]);
      const VIEWS = {
        operator: {
          label: 'Operator (brand colors)', color: operatorColor,
          legend: () => {
            const seen = new Map();
            blocks.forEach(b => {
              const c = operatorColor(b);
              if (c !== NEUTRAL[theme] && c !== ink.surface && b.operator && !seen.has(c)) seen.set(c, b.operator);
            });
            return Array.from(seen, ([color, label]) => ({ color, label }))
              .concat([{ color: NEUTRAL[theme], label: 'other operators' }, { color: ink.surface, label: 'no contract' }]);
          },
        },
        contract: {
          label: 'Contract type', color: b => contractColor[b.contract] || ink.grid,
          legend: () => data.contracts.map(c => ({ color: contractColor[c] || ink.grid, label: c })),
        },
        oil: {
          label: 'Unconventional oil, ' + data.production_period + ' (bbl/d)', bins: [1, 1000, 5000, 15000, 40000, 80000],
          value: b => b.oil_bbl_d, unit: 'bbl/d',
        },
        gas: {
          label: 'Unconventional gas, ' + data.production_period + ' (MMm³/d)', bins: [0.01, 0.5, 2, 5, 10, 20],
          value: b => b.gas_mmm3_d, unit: 'MMm³/d',
        },
        wells: {
          label: 'Unconventional wells drilled since ' + data.wells_since, bins: [1, 10, 50, 100, 200, 400],
          value: b => b.wells_unconv, unit: 'wells',
        },
      };
      Object.values(VIEWS).forEach(v => {
        if (v.bins) { v.color = b => binColor(v.value(b), v.bins); v.legend = () => binLegend(v.bins, v.unit); }
      });

      // View picker + HTML legend, built once next to the chart.
      let controls = document.getElementById(el.id + '-controls');
      if (!controls) {
        controls = document.createElement('div');
        controls.id = el.id + '-controls';
        controls.style.cssText = 'font:13px Poppins,sans-serif;margin:0 0 8px 0;';
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Map view');
        select.style.cssText = 'font:14px Poppins,sans-serif;padding:4px 8px;border:1px solid #A4A3A8;' +
          'border-radius:6px;background:transparent;color:inherit;margin-right:8px;';
        Object.entries(VIEWS).forEach(([k, v]) => {
          const o = document.createElement('option'); o.value = k; o.textContent = v.label; select.appendChild(o);
        });
        const legend = document.createElement('div');
        legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;color:#757575;';
        controls.appendChild(select);
        controls.appendChild(legend);
        el.parentNode.insertBefore(controls, el);
      }
      const select = controls.querySelector('select');
      const legendEl = controls.lastChild;
      if (!select.value) select.value = 'operator';

      const windowColors = [PALETTE[theme][5], PALETTE[theme][3], PALETTE[theme][7], PALETTE[theme][6]];
      const windowRegions = windows.map((w, k) => ({
        name: w.properties.name, silent: true, label: { show: false },
        itemStyle: { areaColor: 'transparent', borderColor: windowColors[k % 4], borderWidth: 2.5, borderType: 'dashed' },
        emphasis: { disabled: true },
      }));
      const provRegions = prov.features.map(f => ({
        name: 'prov:' + f.properties.name, silent: true, label: { show: false },
        itemStyle: { areaColor: 'transparent', borderColor: ink.muted, borderWidth: 1 }, emphasis: { disabled: true },
      }));
      const byName = {};
      blocks.forEach(b => { byName[b.name] = b; });

      const draw = () => {
        const view = VIEWS[select.value];
        legendEl.innerHTML = '';
        view.legend().concat(windows.map((w, k) => ({ outline: windowColors[k % 4], label: w.properties.name.slice(3) + ' window' })))
          .forEach(item => {
            const span = document.createElement('span');
            const sw = document.createElement('span');
            sw.style.cssText = 'display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px;' +
              (item.outline ? 'border:2px dashed ' + item.outline + ';' : 'background:' + item.color + ';border:1px solid ' + ink.grid + ';');
            span.appendChild(sw);
            span.appendChild(document.createTextNode(item.label));
            legendEl.appendChild(span);
          });
        chart.setOption({
          backgroundColor: 'transparent',
          title: Object.assign(title(opts.title, view.label + ' · ' + blocks.length + ' blocks · drag to pan, scroll to zoom', ink), { z: 20 }),
          tooltip: {
            trigger: 'item',
            formatter: p => {
              const b = byName[p.name];
              if (!b) return '';
              return '<b>' + b.name + '</b> (' + (b.id || '') + ')<br>' + b.contract_raw +
                (b.operator ? '<br>Operator: ' + b.operator : '') +
                (b.holders ? '<br>Holders: ' + b.holders : '') +
                (b.area_km2 ? '<br>Area: ' + fmtInt(b.area_km2) + ' km²' : '') +
                (b.start || b.end ? '<br>Contract: ' + (b.start || '?') + ' → ' + (b.end || '?') : '') +
                '<br>Oil ' + data.production_period + ': ' + fmtValue(b.oil_bbl_d, 'bbl/d') +
                '<br>Gas: ' + fmtValue(b.gas_mmm3_d, 'MMm³/d') +
                '<br>Unconventional wells since ' + data.wells_since + ': ' + fmtInt(b.wells_unconv) +
                (data.wells_last_year ? ' (' + fmtInt(b.wells_last_year) + ' in ' + data.wells_last_year + ')' : '');
            },
          },
          geo: {
            map: 'nqn-blocks', roam: true, top: 80, bottom: 10, scaleLimit: { min: 0.5, max: 30 },
            boundingCoords: opts.bounds || [[-71.2, -36.5], [-68.2, -40.4]],
            itemStyle: { areaColor: ink.surface, borderColor: ink.grid, borderWidth: 0.6 },
            emphasis: { itemStyle: { areaColor: PALETTE[theme][3] }, label: { show: false } },
            select: { disabled: true },
            regions: provRegions.concat(windowRegions),
          },
          graphic: [{ type: 'rect', left: 0, top: 0, z: 10, silent: true,
                      shape: { width: 4000, height: 78 }, style: { fill: ink.surface } }],
          series: [{
            type: 'map', map: 'nqn-blocks', geoIndex: 0,
            data: blocks.map(b => ({ name: b.name, value: 1, itemStyle: { areaColor: view.color(b) } })),
          }],
        }, true);
      };
      select.onchange = draw;
      draw();
    },
  };

  const KINDS = { 'bar-race': barRace, 'province-map': provinceMap, treemap, bubbles, candles,
                  radar, calendar, 'change-treemap': changeTree, sankey, 'wells-map': wellsMap,
                  'vm-blocks': vmBlocks };

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
    const extra = Array.isArray(opts.geoUrl) ? Promise.all(opts.geoUrl.map(T.fetchJson))
      : opts.geoUrl ? T.fetchJson(opts.geoUrl) : Promise.resolve(null);
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
