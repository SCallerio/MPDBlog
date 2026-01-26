---
title: Build a Gulf of Mexico Rig Tracker Using BSEE APD Data and Plotly
description: A Python-based workflow to analyze Gulf of Mexico offshore drilling activity using BSEE APD data, interactive maps, and operator- and rig-level summaries.
author: Santiago Callerio
layout: post
published: true
categories: Data_Analytics
excerpt_separator: <!--more-->
---

<!-- Static preview - appears on home/list AND full post initially -->
<div class="static-map-preview" style="text-align:center; margin: 30px 0;">
  <a href="{{ page.url | relative_url }}">
    <picture>
      <source srcset="{{ site.baseurl }}/images/bsee-gom-map-preview.png" media="(prefers-color-scheme: dark)">
      <img src="{{ site.baseurl }}/images/bsee-gom-map-preview.png" 
           alt="Preview: BSEE Gulf of Mexico approved wells map"
           style="width:100%; max-width:900px; height:auto; border-radius:8px; border:1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    </picture>
  </a>
  <p style="font-style:italic; color:#666; margin-top:10px;">
    Static Map Preview - <strong>Click for full interactive map</strong> →
  </p>
  <p style="text-align: left;"><i>This post presents a practical Python workflow for tracking offshore drilling activity in the U.S. 
Gulf of Mexico (GoM) using publicly available BSEE Application for Permit to Drill (APD) data. It demonstrates how to 
download the GoM wells permit data, visualize recent approvals on an interactive rig-tracking map with Plotly, and 
generate operator- and rig-level summary tables relevant to offshore drilling and MPD planning.</i></p>
</div>

<!--more-->

<!-- Full post content starts here -->
*This post presents a practical Python workflow for tracking offshore drilling activity in the U.S. 
Gulf of Mexico (GoM) using publicly available BSEE Application for Permit to Drill (APD) data. It demonstrates how to 
download the GoM wells permit data, visualize recent approvals on an interactive rig-tracking map with Plotly, and 
generate operator- and rig-level summary tables relevant to offshore drilling and MPD planning.*
<h2>BSEE-Approved Gulf of Mexico Wells</h2>
<h4><i>Interactive Map of eWell APD Approvals (Last 12 Months), Colored by Water Depth</i></h4>

<div id="map-container" style="width: 100%; height: 60vh; min-height: 500px; margin: 30px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; position: relative;">
  <div id="bsee-map" style="width: 100%; height: 100%;"></div>
</div>
<small>*Source: <a href="https://www.data.bsee.gov/Well/eWellAPD/Default.aspx">BSEE eWell APD database</a>.
Water depth encoded via color scale (ft).
Hover for well and rig details; zoom and selection tools available in the upper-left.*</small>

<!-- Tables Section -->
<h3>Operator Activity (Unique Wells & Average Water Depth)</h3>
<div id="company-table-container" style="margin: 30px 0; overflow-x: auto;"></div>

<h3>Rig Type Activity (Unique Rigs & Average Water Depth)</h3>
<div id="rig-table-container" style="margin: 30px 0; overflow-x: auto;"></div>

<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>

<script src="{{ site.baseurl }}/assets/js/updateBSEEMap.js"></script>
*<small>
  Data source: <a href="https://www.data.bsee.gov/Well/eWellAPD/Default.aspx" target="_blank">BSEE eWell APD</a> | 
  Filtered for last 12-months approved wells in the Gulf of Mexico (GoM)
</small>*

<script>
document.addEventListener('DOMContentLoaded', function() {
  const interactiveMap = document.getElementById('map-container');
  if (interactiveMap) {
    const staticPreview = document.querySelector('.static-map-preview');
    if (staticPreview) {
      staticPreview.style.display = 'none';
    }
  }
});
</script>
---
# Step-by-Step to Build the GoM Rig Tracker Dashboard in Jupyter Notebooks
The notebook containing the code referenced below can be downloaded from the following link: 
[2026-01-25-bsee-map-jupyter.ipynb]("{{ site.baseurl}} /src/2026-01-25-bsee-map-jupyter-example/2026-01-25-bsee-map-jupyter.ipynb")
## 1. Data Acquisition from BSEE eWell APD Database
### 1.1 Application for Permit to Drill (APD) Dataset
The foundation of the rig tracker dashboard is the [Bureau of Safety and Environmental Enforcement (BSEE) eWell 
Application for Permit to Drill (APD) database](https://www.data.bsee.gov/Well/eWellAPD/Default.aspx). 
This dataset provides regulatory-approved well information for offshore operations in the U.S. Gulf of Mexico, including
operator, well location, water depth, rig metadata, and approval dates. These fields are particularly well suited for 
spatial, temporal, and operational analysis of offshore drilling activity.

![BSEE eWell APD Data Sample]({{ site.baseurl }}/images/BSEE_APD_site.png)
*<small>BSEE eWell APD Data Sample - Screenshot from BSEE's eWell APD data download page</small>*

For this workflow, the APD data are downloaded directly from the [BSEE's public "Raw Data" portal](https://www.data.bsee.gov/Main/RawData.aspx) in compressed format. The analysis is intentionally based on officially 
approved permits, ensuring regulatory consistency and avoiding uncertainty associated with speculative or 
announced-but-unapproved wells.

<!--more-->
<div class="jupyter-container">
{% include notebooks/2026-01-25-bsee-map-jupyter.html %}
</div>

## Data Source & Disclaimer
Data used in this analysis were obtained from the publicly available BSEE eWell Application for Permit to Drill (APD) 
database. The dataset was accessed via a bulk download and processed using custom Python workflows.

The analysis and visualizations presented here are for informational purposes only and reflect the author’s 
interpretation of the data. They do not represent official positions or endorsements by BSEE. Results are subject to 
the inherent limitations and reporting uncertainties of the source dataset.
