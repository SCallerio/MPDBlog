// This function generates both tables from the loaded data
function generateTables(data) {
  // Filter same as map (valid coords + water depth)
  const filteredData = data.filter(row =>
    row.SURF_LATITUDE != null &&
    row.SURF_LONGITUDE != null &&
    row.SURF_LATITUDE >= 20 && row.SURF_LATITUDE <= 35 &&
    row.SURF_LONGITUDE >= -100 && row.SURF_LONGITUDE <= -80 &&
    row.WATER_DEPTH != null
  );

  if (filteredData.length === 0) {
    const msg = '<p style="text-align:center; color:#666; padding:40px;">No wells with valid coordinates found.</p>';
    document.getElementById('company-table-container').innerHTML = msg;
    document.getElementById('rig-table-container').innerHTML = msg;
    return;
  }

  // === 1. Unique Wells by Company (Operator) ===
  const companyMap = {};
  filteredData.forEach(row => {
    const op = row.BUS_ASC_NAME || 'Unknown Operator';
    if (!companyMap[op]) companyMap[op] = { wells: new Set(), depths: [] };
    if (row.WELL_NAME) companyMap[op].wells.add(row.WELL_NAME);
    companyMap[op].depths.push(row.WATER_DEPTH);
  });

  const companyRows = Object.keys(companyMap)
    .map(op => ({
      operator: op,
      wellCount: companyMap[op].wells.size,
      avgDepth: Math.round(companyMap[op].depths.reduce((a,b) => a + b, 0) / companyMap[op].depths.length)
    }))
    .sort((a, b) => b.wellCount - a.wellCount);  // Most active first

  // === 2. Unique Rigs by Rig Type ===
  const rigTypeMap = {};
  filteredData.forEach(row => {
    const type = row.RIG_TYPE_CODE || 'Unknown';
    if (!rigTypeMap[type]) rigTypeMap[type] = { rigs: new Set(), depths: [] };
    if (row.RIG_NAME) rigTypeMap[type].rigs.add(row.RIG_NAME);
    rigTypeMap[type].depths.push(row.WATER_DEPTH);
  });

  const rigTypeRows = Object.keys(rigTypeMap)
    .map(type => ({
      rigType: type,
      rigCount: rigTypeMap[type].rigs.size,
      avgDepth: Math.round(rigTypeMap[type].depths.reduce((a,b) => a + b, 0) / rigTypeMap[type].depths.length)
    }))
    .sort((a, b) => b.rigCount - a.rigCount);

  // === Render Table Function ===
  function renderTable(containerId, rows, columns, title) {
    let html = `
      <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; background:#1e1e1e; color:#ddd;">
        <caption style="caption-side:top; font-weight:bold; font-size:18px; padding:15px; background:#222; color:white; text-align:left;">
          ${title}
        </caption>
        <thead>
          <tr style="background:#333;">
            ${columns.map(col => `<th style="padding:12px; border:1px solid #444; text-align:left; color:white;">${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    rows.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? '#222' : '#2a2a2a';  // Alternating dark grays
      html += `<tr style="background:${bgColor};">`;
      html += `<td style="padding:12px; border:1px solid #444;">${row.operator || row.rigType}</td>`;
      html += `<td style="padding:12px; border:1px solid #444; text-align:center;">${row.wellCount || row.rigCount}</td>`;
      html += `<td style="padding:12px; border:1px solid #444; text-align:right;">${row.avgDepth.toLocaleString()} ft</td>`;
      html += `</tr>`;
    });

    html += `
        </tbody>
      </table>
    `;
    document.getElementById(containerId).innerHTML = html;
  }

  renderTable('company-table-container', companyRows, ['Operator', 'Unique Wells', 'Avg Water Depth'], 'Unique Wells by Operator');
  renderTable('rig-table-container', rigTypeRows, ['Rig Type', 'Unique Rigs', 'Avg Water Depth'], 'Rig Activity by Type');
}

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

async function loadBSEEMap() {
  const mapDiv = document.getElementById('bsee-map');
  const container = document.getElementById('map-container');

  try {
      // Hardcoded relative path — no Liquid needed
      const response = await fetch('/data/processed/gom_2025_wells.json');

      if (!response.ok) {
        throw new Error(`Failed to load data (HTTP ${response.status})`);
      }

      const data = await response.json();

    const filteredData = data.filter(row =>
      row.SURF_LATITUDE != null &&
      row.SURF_LONGITUDE != null &&
      row.SURF_LATITUDE >= 20 && row.SURF_LATITUDE <= 35 &&
      row.SURF_LONGITUDE >= -100 && row.SURF_LONGITUDE <= -80 &&
      row.WATER_DEPTH != null &&
      row.APD_STATUS_DT
    );

    if (filteredData.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:150px; color:#666;">No approved wells found in the current dataset.</p>';
      return;
    }

    // Dynamic title
    const dates = filteredData
      .map(row => new Date(row.APD_STATUS_DT))
      .filter(d => !isNaN(d));

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const formatMonthYear = (date) =>
      date.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '-');

    const dateRange = `${formatMonthYear(minDate)} to ${formatMonthYear(maxDate)}`;
    const titleText = `Gulf of Mexico (GoM) eWell APD Approvals (${dateRange})`;

    const lats = filteredData.map(r => r.SURF_LATITUDE);
    const lons = filteredData.map(r => r.SURF_LONGITUDE);
    const depths = filteredData.map(r => r.WATER_DEPTH);

    const hoverTexts = filteredData.map(row =>
      `Well: ${row.WELL_NAME || 'N/A'}<br>` +
      `API: ${row.API_WELL_NUMBER || 'N/A'}<br>` +
      `Operator: ${row.BUS_ASC_NAME || 'N/A'}<br>` +
      `Rig: ${row.RIG_NAME || 'N/A'}<br>` +
      `Rig Type: ${row.RIG_TYPE_CODE || 'N/A'}<br>` +
      `Water Depth: ${formatNumberWithLocale(row.WATER_DEPTH)} ft<br>` +
      `Approved: ${row.APD_STATUS_DT || 'N/A'}`
    );

    const trace = {
      type: 'scattermapbox',
      lat: lats,
      lon: lons,
      mode: 'markers',
      marker: {
        size: 10,
        color: depths,
        colorscale: [
          [0.0, 'rgb(240, 248, 255)'],
          [0.2, 'rgb(173, 216, 230)'],
          [0.4, 'rgb(135, 206, 235)'],
          [0.6, 'rgb(70, 130, 180)'],
          [0.8, 'rgb(25, 25, 112)'],
          [1.0, 'rgb(0, 0, 139)']
        ],
        colorbar: {
          title: 'Water Depth (ft)',
          tickformat: ',.0f'},
        opacity: 0.85
      },
      text: hoverTexts,
      hovertemplate: '%{text}<extra></extra>'
    };

    const layout = {
      title: { text: titleText, font: { size: 18 } },
      mapbox: {
        style: 'open-street-map',
        center: { lat: 27.5, lon: -90 },
        zoom: 4.5
      },
      margin: { t: 70, r: 20, b: 20, l: 20 }
    };

    const config = { responsive: true };

    // Plot and force resize to fit container
    Plotly.newPlot('bsee-map', [trace], layout, config).then(() => {
      Plotly.Plots.resize(mapDiv);
    });

    // Also resize on window resize
    window.addEventListener('resize', () => Plotly.Plots.resize(mapDiv));
    // Generate tables using the same filtered data
      generateTables(filteredData);

  } catch (error) {
    console.error('Map error:', error);
    container.innerHTML = `<p style="color:red; text-align:center; padding:100px;">Error: ${error.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadBSEEMap);
