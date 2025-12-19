function updatePlot(thresh) {
    threshold = thresh;
    // convert time (hours) to minutes for hover display
    const timeHours = time.map(t => Number(t) * 1);

    // Split signal for coloring (In-Slips below threshold, Off-Slips above)
    const inSlips = signal.map((y, i) => y < thresh ? y : NaN);
    const offSlips = signal.map((y, i) => y >= thresh ? y : NaN);
    const theme = getTheme();

    const data = [
      // Left: Time series - Original signal (thin gray for full, or directly colored parts)
      // Left: Time series - Original signal (thin gray for full, or directly colored parts)
      {
        x: time,
        y: signal,
        type: 'scatter',
        mode: 'lines',
        name: 'Original Hookload Signal',
        line: { color: 'rgba(150,150,150,0.5)', width: 1 },
        xaxis: 'x',
        yaxis: 'y',
        customdata: timeHours,
        hovertemplate: 'Time: %{customdata:.1f} hr<br>Hookload: %{y}<extra></extra>'
      },
      {
        x: time,
        y: inSlips,
        type: 'scatter',
        mode: 'lines',
        name: 'Hookload In-Slips',
        line: { color: orange, width: 2 },
        xaxis: 'x',
        yaxis: 'y',
        customdata: timeHours,
        hovertemplate: 'Time: %{customdata:.1f} hr<br>Hookload: %{y}<extra></extra>'
      },
      {
        x: time,
        y: offSlips,
        type: 'scatter',
        mode: 'lines',
        name: 'Hookload Off-Slips',
        line: { color: blue, width: 2 },
        xaxis: 'x',
        yaxis: 'y',
        customdata: timeHours,
        hovertemplate: 'Time: %{customdata:.1f} hr<br>Hookload: %{y}<extra></extra>'
      },
      // Threshold line (left)
      { x: [time[0], time[time.length-1]], y: [thresh, thresh], type: 'scatter', mode: 'lines', name: `Threshold = ${thresh.toFixed(2)}`, line: {color: theme.font_color, dash: 'dash'}, xaxis: 'x', yaxis: 'y' },

      // Right: Horizontal histogram (orientation: 'h')
      { y: signal, type: 'histogram', name: 'Distribution', marker: {color: blue}, opacity: 0.8, xaxis: 'x2', yaxis: 'y2', nbinsy: 50, histnorm: 'count' },
      // Threshold line (right) - vertical for horizontal hist
      { x: [0, 20000], y: [thresh, thresh], type: 'scatter', mode: 'lines', name: `Threshold = ${thresh.toFixed(2)}`, line: {color: theme.font_color, dash: 'dash'}, xaxis: 'x2', yaxis: 'y2' },

      // { x: [0, 20000], y: [thresh, thresh], type: 'scatter', mode: 'lines', name: `Threshold = ${thresh.toFixed(2)}`, line: {color: orange, dash: 'dash'}, xaxis: 'x2', yaxis: 'y2', yaxis: {range: [Math.min(...signal)*0.9, Math.max(...signal)*1.1]} }
    ];

    const layout = {
      paper_bgcolor: theme.paper_bg,
      plot_bgcolor: theme.plot_bg,
      font: { family: 'Arial, sans-serif', size: 12 , color: theme.font_color},
      grid: {rows: 1, columns: 2, pattern: 'independent'},
      title: { text: 'Hookload Threshold Selection', font: {size: 24} }, // No overall title, subtitles on axes
      xaxis: {
        title: {text: 'Time (hr)'},
        title_standoff: 1, // Reduce space between title and axis
        showgrid: true,
        gridcolor: theme.grid_color,
        gridwidth: 1,
        griddash: 'dot',
        zeroline: false,
        tickfont: {family: 'Arial, sans-serif', color: theme.font_color}
      },
      yaxis: {
        title: {text: 'Hookload Value (klbf)'},
        title_standoff: 1, // Reduce space between title and axis
        showgrid: true,
        gridcolor: theme.grid_color,
        gridwidth: 1,
        griddash: 'dot',
        zeroline: false,
        tickfont: {color: theme.font_color}
      },
      xaxis2: {
        title: {text: 'Frequency'},
        showgrid: true,
        gridcolor: theme.grid_color,
        griddash: 'dot',
        gridwidth: 1,
        tickfont: {color: theme.font_color}
      },
      yaxis2: {
        title: {text: 'Hookload Value (klbf)'},
        showgrid: true,
        gridcolor: theme.grid_color,
        griddash: 'dot',
        gridwidth: 1,
        tickfont: {color: theme.font_color}
      },
      margin: { t: 50, b: 100 , l: 50, r: 25}, // Add bottom margin to make room
      legend: {
        orientation: "h",          // Horizontal legend
        columns: 4,              // Two columns
        xanchor: "center",         // Anchor the center of the legend
        yanchor: "top",            // Anchor the top of the legend
        x: 0.5,                    // Position the anchor at the horizontal center (0.5)
        y: -0.2                    // Position the anchor below the plot area (adjust value as needed)
      },
      hovermode: 'closest'
    };

    Plotly.newPlot(gd, data, layout, {responsive: true});

    document.getElementById('threshold-value').textContent = threshold.toFixed(2);
  }
