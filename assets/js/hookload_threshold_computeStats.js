// Function to format a number using locale-specific thousands separators
  function formatNumberWithLocale(number) {
    // Using 'en-US' locale formats with a comma as the thousands separator
    // and a period as the decimal separator.
    // The options configure minimum decimal places if needed.
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      useGrouping: true // Ensures grouping separators are used
    });
    return formatter.format(number);
  }

function computeStats() {
    computeBtn.disabled = true;
    computeBtn.textContent = 'Computing...';

    setTimeout(() => {  // Allows button text to update
      const results = [];
      for (let i = 0; i < signal.length; i++) {
        if (signal[i] < threshold) {
          // Coerce to numbers to avoid NaN from strings/undefined
          results.push({
            depth: Number(depth[i]),
            mpd_pt5: Number(mpd_pt5[i]),
            time: Number(time[i])
          });
        }
      } // <-- ensure the for loop is closed here

      if (results.length === 0) {
        tableContainer.innerHTML = '<p style="text-align:center; color:#999;">No points below the selected threshold (no In-Slips data).</p>';
        computeBtn.disabled = false;
        computeBtn.textContent = 'Compute SBP Statistics (In-Slips Only)';
        return;
      }

      // Group by depth rounded to nearest 1 ft
      const groups = {};
      results.forEach(r => {
        const key = Math.round(r.depth);
        if (!groups[key]) groups[key] = { times: [], values: [] };
        groups[key].times.push(r.time);
        groups[key].values.push(r.mpd_pt5);
      });
      renderSBPTimeSeries(groups, containerId = 'timeseries-container');
      renderBoxplots(groups, 'boxplot-container');
      const statsRows = Object.keys(groups)
        .map(d => {
          const g = groups[d];

          // Ensure numeric values and filter out invalid entries
          const values = g.values.map(Number).filter(Number.isFinite);
          const numericTimes = g.times.map(Number).filter(Number.isFinite);

          if (values.length === 0) return null;

          const sortedVals = values.slice().sort((a, b) => a - b);
          const n = values.length;

          // Duration in minutes: need at least two valid time points
          let durationMin = 0;
          if (numericTimes.length >= 2) {
            const minT = Math.min(...numericTimes);
            const maxT = Math.max(...numericTimes);
            const timeDiffHours = maxT - minT;
            if (Number.isFinite(timeDiffHours) && timeDiffHours > 0) {
              durationMin = Math.round(timeDiffHours * 60 * 10.0) / 10.0;
            }
          }

          const sum = values.reduce((a, b) => a + b, 0);
          const meanRaw = sum / n;
          const mean = Math.round(meanRaw);

          const variance = values.reduce((a, v) => a + Math.pow(v - meanRaw, 2), 0) / n;
          const std = Math.round(Math.sqrt(variance));

          const minVal = Math.round(sortedVals[0]);
          const q25 = Math.round(sortedVals[Math.floor(n * 0.25)]);
          const q50 = Math.round(sortedVals[Math.floor(n * 0.50)]);
          const q75 = Math.round(sortedVals[Math.floor(n * 0.75)]);
          const maxVal = Math.round(sortedVals[sortedVals.length - 1]);

          return {
            depth: formatNumberWithLocale(d),
            duration_min: durationMin,
            mean: mean,
            std: std,
            min: minVal,
            q25: q25,
            q50: q50,
            q75: q75,
            max: maxVal
          };
        })
        .filter(row => row !== null)
        .sort((a, b) => a.depth - b.depth);

      // Build table (unchanged)
      let html = '<table style="text-align: center; width:100%; border-collapse:collapse; margin-top:10px; border:1px solid #ccc;">';
      html += '<tr style="background:#f0f0f0;"><th>Depth (ft)</th><th>In-Slips<br>Time (min)</th><th>mean</th><th>std</th><th>min</th><th>25%</th><th>50%</th><th>75%</th><th>max</th></tr>';
      statsRows.forEach(r => {
        html += `<tr><td>${r.depth}</td><td>${r.duration_min}</td><td>${r.mean}</td><td>${r.std}</td><td>${r.min}</td><td>${r.q25}</td><td>${r.q50}</td><td>${r.q75}</td><td>${r.max}</td></tr>`;
      });
      html += '</table>';
      tableContainer.innerHTML = html;

      computeBtn.disabled = false;
      computeBtn.textContent = 'Compute SBP Statistics (In-Slips Only)';
    }, 50);
  }

// javascript
function renderSBPTimeSeries(groups, containerId = 'timeseries-container') {
  const container = document.getElementById(containerId);
  const theme = getTheme();
  if (!container) return;
  var tableauColorblind10 = [
    '#006BA4', '#FF800E', '#ABABAB', '#595959', '#5F9ED1',
    '#C85200', '#898989', '#A2C8EC', '#FFBC79', '#CFCFCF'
  ];

  // Build one trace per group (depth)
  const depthKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const traces = depthKeys.map(k => {
    const times = groups[k].times || [];
    const vals = groups[k].values || [];
    const colorIndex = depthKeys.indexOf(k) % tableauColorblind10.length;

    // Pair, coerce, filter invalid entries
    const pairs = [];
    for (let i = 0; i < Math.min(times.length, vals.length); i++) {
      const t = Number(times[i]);
      const v = Number(vals[i]);
      if (Number.isFinite(t) && Number.isFinite(v)) pairs.push({ t, v });
    }
    if (pairs.length === 0) return null;

    // Sort by absolute time
    pairs.sort((a, b) => a.t - b.t);

    // Shift time so first point is zero and convert hours -> minutes
    const t0 = pairs[0].t;
    const x = pairs.map(p => (p.t - t0) * 60); // minutes
    const y = pairs.map(p => p.v);

    return {
      x,
      y,
      name: `SBP @ ${formatNumberWithLocale(k)} ft MD`,
      mode: 'lines',
      type: 'scatter',
      marker: { size: 4 },
      line: { width: 2, color: tableauColorblind10[colorIndex] },
      hovertemplate: 'Depth: ' + k + ' ft<br>Time: %{x:.1f} min<br>SBP: %{y}<extra></extra>'
    };
  }).filter(Boolean);

  if (traces.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999;">No valid time-series data to plot.</p>';
    return;
  }

  const layout = {
    paper_bgcolor: theme.paper_bg,
    plot_bgcolor: theme.plot_bg,
    font: { family: 'Arial, sans-serif', size: 12 , color: theme.font_color},
    title: {text: 'SBP vs. Elapsed Time\nby Connection Depth', font: {size: 16}},
    xaxis: { title: 'Elapsed time (min)', zeroline: false ,
            showgrid: true,
            gridcolor: theme.grid_color,
            gridwidth: 1,
            griddash: 'dot',
            zeroline: false,
            tickfont: {family: 'Arial, sans-serif', color: theme.font_color}},
    yaxis: { title: 'SBP (psi)', zeroline: false,
            showgrid: true,
            gridcolor: theme.grid_color,
            gridwidth: 1,
            griddash: 'dot',
            zeroline: false,
            tickfont: {family: 'Arial, sans-serif', color: theme.font_color}},
    margin: { t: 40, b: 60, l: 50, r: 5 },
    legend: {
        orientation: "h",          // Horizontal legend
        xanchor: "center",         // Anchor the center of the legend
        yanchor: "top",            // Anchor the top of the legend
        x: 0.5,                    // Position the anchor at the horizontal center (0.5)
        y: -0.2                    // Position the anchor below the plot area (adjust value as needed)
      },
    hovermode: 'closest'
  };

  Plotly.newPlot(container, traces, layout, { responsive: true });
}

// javascript
function renderBoxplots(groups, containerId = 'boxplot-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Ensure side-by-side layout with the timeseries plot
  const tsContainer = document.getElementById('timeseries-container');
  const parent = container.parentElement || (tsContainer ? tsContainer.parentElement : null);
  if (parent) {
    parent.style.display = 'flex';
    parent.style.gap = '12px';
    // Give each child sensible widths (adjust as needed)
    if (tsContainer) {
      tsContainer.style.flex = '1 1 60%';
      tsContainer.style.minWidth = '320px';
    }
    container.style.flex = '1 1 40%';
    container.style.minWidth = '280px';
  }

  const palette = [
    '#006BA4', '#FF800E', '#ABABAB', '#595959', '#5F9ED1',
    '#C85200', '#898989', '#A2C8EC', '#FFBC79', '#CFCFCF'
  ];

  const depthKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const boxTraces = depthKeys.map((k, idx) => {
    const vals = (groups[k].values || []).map(Number).filter(Number.isFinite);
    if (!vals.length) return null;
    return {
      y: vals,
      name: `${formatNumberWithLocale(k)} ft`,
      type: 'box',
      boxpoints: 'outliers',
      jitter: 0.3,
      marker: { size: 4, color: palette[idx % palette.length] },
      line: { color: palette[idx % palette.length] },
      hovertemplate: 'Depth: ' + k + ' ft<br>SBP: %{y}<extra></extra>'
    };
  }).filter(Boolean);

  if (!boxTraces.length) {
    container.innerHTML = '<p style="text-align:center; color:#999;">No valid data for boxplot.</p>';
    return;
  }

  const theme = typeof getTheme === 'function' ? getTheme() : { paper_bg: '#fff', plot_bg: '#fff', font_color: '#000', grid_color: '#eee' };

  const layout = {
    font: { family: 'Arial, sans-serif', size: 12 , color: theme.font_color},
    title: { text: 'SBP Distribution by Connection Depth', font: { size: 16 } },
    yaxis: {
      title: 'SBP (psi)',
      showgrid: true,
      gridcolor: theme.grid_color,
      zeroline: false
    },
    xaxis: {
      title: 'Depth (ft)',
      tickangle: -45,
      automargin: true
    },
    paper_bgcolor: theme.paper_bg,
    plot_bgcolor: theme.plot_bg,
    font: { family: 'Arial, sans-serif', color: theme.font_color },
    margin: { t: 40, b: 80, l: 60, r: 20 },
    showlegend: false,
    hovermode: 'closest'
  };

  Plotly.newPlot(container, boxTraces, layout, { responsive: true });
}

// Integration: call after renderSBPTimeSeries in computeStats()
// renderSBPTimeSeries(groups, 'timeseries-container');
// renderBoxplots(groups, 'boxplot-container');

