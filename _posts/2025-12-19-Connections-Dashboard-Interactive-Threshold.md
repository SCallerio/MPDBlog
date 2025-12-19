---
title: Build an MPD Connections Dashboard, using an Interactive Hookload Threshold Selector
author: Santiago Callerio
layout: post
published: true
categories: Data_Analytics
excerpt_separator: <!--more-->
---

[//]: # (<h2 style="text-align: center; margin-bottom: 20px;">Hookload Threshold Selection</h2>)
![Signals Plot]({{ site.baseurl }}/images/thisisengineering-f4pUuCc3M0g-unsplash.jpg)
*<small>Photo by <a href="https://unsplash.com/@thisisengineering?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">ThisisEngineering</a> on <a href="https://unsplash.com/photos/person-using-black-laptop-computer-f4pUuCc3M0g?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
<br /></small>*
*This post provides the code and guide to build an MPD connections summary dashboard in jupyter notebooks, filtering the drilling 
connections by visually setting the hookload threshold. The complete code is provided, and the notebook is available for
download in the following link [In-Slips Detection Notebook]().*
<!--more-->
# Introduction
Tracking connections performance during an MPD operation brings in valuable information while drilling. There's 
different cases and approaches, but these can include:
- Measuring ECD and ESD deviation from target for Constant Bottom Hole Pressure (CBHP) operations, allowing for 
adjustments in the MPD hydraulic model and ramp-model to adjust within set thresholds
- Effectively capturing annular pressure build-up during connections, and comparing the trend, for Pressure Trapping MPD
operations with statically-underbalanced mud. This allows to track the pore pressure as drilling progresses, and also to 
fingerprint the response of the well in connections, detecting any balloning issues 
- Tracking Ramp-Down, Connection and Ramp-Up time, for performance tracking, looking for drilling optimization opportunities

However, filtering connections from normal drilling data can be challenging, especially when dealing with noisy hookload signals. A common approach is to set a hookload threshold to identify in-slips (connections) versus off-slips (normal drilling), setting an In-Slips conditions as:
```python
if hookload < hookload_threshold:
	in_slips = True
else:
	in_slips = False
```
The challenge behind this approach is finding the appropiate value for the hookload threshold. This can be done:
- Visually, by looking at the minimum hookload values at each connection, which represent the actual block weight (i.e., when the 
drill-string is set in-slips, the hookload value will reflect the travelling block weight)
- Automatically detected, following the approach proposed by [Arnaout et al. (2011)](https://doi.org/10.1109/HIS.2011.6122164),
which fits a Gaussian Mixture Model (GMM) to the three clusters observed in hookload data, using the 
Expectation–Maximization (EM) algorithm to estimate distribution parameters. The threshold is then determined 
automatically as the intersection between the probability density functions of the two lower clusters, applying Bayes’ theorem (Callerio et al. (2025))

This post describes the **visual approach**, providing the guide to **code a python notebook to find the suitable 
threshold to filter the connections, and compute the statistics per connection**.

# Hookload Threshold Selection

Move the slider to adjust the hookload threshold, and observe how the in-slips (connections) are identified in the plot. The
plot is interactive, allowing to zoom and pan to inspect the data closely. After selecting the threshold, click the button to compute the
statistics for Surface Back Pressure (SBP) during in-slips periods only, grouped by connection depth. This also renders a plot
with the SBP trend for each in-slips period.

[//]: # Interactive Hookload Plot with Threshold Slider
<div id="plot" style="width:100%; height:400px;"></div>

<div style="margin: 20px 0; max-width: 800px;">
  <label for="threshold">Hookload Threshold (klbf): <span id="threshold-value">150</span></label><br>
  <input type="range" id="threshold" min="0" max="250" step="0.1" value="150" style="width:100%;">
</div>

<div style="text-align: center; margin: 20px 0;">
  <button id="compute-btn" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
    Compute SBP Statistics (In-Slips Only)
  </button>
</div>

<!-- Results table -->
<div id="stats-table" style="margin-top: 30px; font-family: Arial, sans-serif;">
  <h3 style="text-align: center;">SBP Statistics by Connection Depth (In-Slips Only)</h3>
  <div id="table-container"><p>Adjust the threshold and click the button to compute statistics.</p></div>
</div>
<!-- Side-by-side additional plots (below the table) -->
<div style="display: flex; justify-content: space-between; margin-top: 40px;">
  <div id="timeseries-container" style="width:55%; height:400px; border: 1px solid #ccc;"></div>
  <div id="boxplot-container" style="width:45%; height:400px; border: 1px solid #ccc;"></div>
</div>
<!-- Plotly.js -->
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<script>
  let time = [];
  let signal = [];
  let depth = [];
  let mpd_pt5 = [];

  const gd = document.getElementById('plot');
  const tableContainer = document.getElementById('table-container');
  const computeBtn = document.getElementById('compute-btn');

  fetch('{{ "/data/hookload-data.json" | relative_url }}')  // Jekyll handles the path correctly
    .then(response => response.json())
    .then(data => {
      time = data.time;
      signal = data.signal;
      depth = data.depth;
      mpd_pt5 = data.mpd_pt5;
      updatePlot(150);  // Initial threshold
    })
    .catch(err => console.error('Failed to load data:', err));
  
  // tableau-colorblind10 colors
  const blue = '#006BA4';   // Original signal, Off-Slips
  const orange = '#FF800E'; // In-Slips, Threshold line
  const gray = '#ABABAB';   // (unused here, but available)
  const darkgray = '#595959'; // (unused here, but available)

  // Light theme colors
  const light = {
    paper_bg: '#ffffff',
    plot_bg: '#ffffff',
    font_color: '#333333',
    grid_color: '#dddddd',
    legend_bg: 'rgba(255,255,255,0.9)',
    legend_border: '#cccccc',
    faint_line: 'rgba(150,150,150,0.5)',
    hover_bg: '#f0f0f0'
  };

  // Dark theme colors
  const dark = {
    paper_bg: '#1e1e1e',
    plot_bg: '#1e1e1e',
    font_color: '#e0e0e0',
    grid_color: '#444444',
    legend_bg: 'rgba(30,30,30,0.8)',
    legend_border: '#666666',
    faint_line: 'rgba(180,180,180,0.5)',
    hover_bg: '#333333'
  };

  let threshold = 150;
  // Functions to format plots based on theme
  function getTheme() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? dark : light;
    }

  function applyTheme(theme) {
    document.querySelector('h2').style.color = theme === dark ? '#ffffff' : '#000000';
    document.querySelector('div[style*="margin: 20px 0"] > label').style.color = theme === dark ? '#cccccc' : '#333333';
  }
</script>

<!-- Plot update script -->
<script src = "{{site.baseurl}}/assets/js/hookload_threshold_updatePlot.js"></script>
<!-- Compute statistics button -->
<script src = "{{site.baseurl}}/assets/js/hookload_threshold_computeStats.js"></script>

<script>
  // Slider
  document.getElementById('threshold').addEventListener('input', e => {
    updatePlot(parseFloat(e.target.value));
  });
  // Button
  computeBtn.addEventListener('click', computeStats);

  // Initial plot
  updatePlot(threshold);
</script>


---
# References
Arnaout, A., Esmael, B., Fruhwirth, R. K., and Thonhauser, G. 2011. Automatic threshold tracking of sensor data using 
expectation maximization algorithm. Paper presented at the Proceedings of the 2011 11th International Conference on 
Hybrid Intelligent Systems, HIS 2011. [https://doi.org/10.1109/HIS.2011.6122164](https://doi.org/10.1109/HIS.2011.6122164).


Callerio, S., Shawcross, J., Kanter, N., Ashok, P., van Oort, E., and Kvalo, M. 2025. Enhanced MPD Well Control Through 
Virtual Trip Tank (VTT) Calibration. Paper presented at the IADC/SPE International Drilling Conference and Exhibition, 
Galveston, Texas, USA. SPE-230687-MS.
