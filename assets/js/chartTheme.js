// assets/js/chartTheme.js
// Shared colors and helpers for the ECharts charts (lineRace.js, energyCharts.js).
// Exposes window.MPDChartTheme.

(function () {
  // Fixed categorical order (never cycled).
  const PALETTE = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    dark:  ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  };
  const INK = {
    light: { text: '#151515', muted: '#757575', grid: '#e4e3e3', surface: '#F8F7F7', border: '#ffffff' },
    dark:  { text: '#F8F7F7', muted: '#A4A3A8', grid: '#2e2e2e', surface: '#151515', border: '#151515' },
  };
  // One-hue sequential ramp (light -> dark) for magnitude, e.g. the choropleth.
  const SEQUENTIAL = {
    light: ['#e6effa', '#b7d3f6', '#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
    dark:  ['#1f2a38', '#184f95', '#1c5cab', '#2a78d6', '#5598e7', '#86b6ef', '#cde2fb'],
  };
  // Up / down pair for candles and +/- bars: blue and orange stay apart for
  // red-green color blindness (unlike the usual green/red).
  const UPDOWN = {
    light: { up: '#2a78d6', down: '#eb6834' },
    dark:  { up: '#3987e5', down: '#d95926' },
  };

  // Company brand colors, matched on the label: [pattern, light, dark]. Dark
  // variants are lighter only where the brand color would disappear on the
  // dark background.
  // Sources: Shell and Sinopec published colors; YPF #0063C2 (2017 logo,
  // third-party); Vista #414042 (Brandfetch); TotalEnergies orange from its
  // seven-color palette (its red would clash with Sinopec); Tecpetrol dark
  // green approximated from its trademark (green/blue bands, no published
  // hex); Pampa Energía #1ED760 (Brandfetch, unconfirmed). Pan American
  // Energy red #C80000, Pluspetrol dark teal #0C5678 (dark mode: its teal
  // accent #00868B) and CAPEX electric blue #0086D6 from the blog author.
  const BRAND_COLORS = [
    [/^YPF\b/, '#0063C2', '#3D8BE0'],
    [/^SHELL\b/, '#FBCE07', '#FBCE07'],
    [/^(SINO|SINOPEC)\b/, '#ED1C24', '#F0454B'],
    [/^TOTAL\b/, '#FF7800', '#FF7800'],
    [/^(VST|VISTA)\b/, '#414042', '#A7A9AC'],
    [/^TECPETROL\b/, '#00843D', '#2BA562'],
    [/^PAMPA\b/, '#1ED760', '#1ED760'],
    [/^(PAE|PAN AMERICAN)\b/, '#C80000', '#E0302F'],
    [/^PLUSPETROL\b/, '#0C5678', '#00868B'],
    [/^CAPEX\b/, '#0086D6', '#0086D6'],
  ];
  // Non-brand colors for companies without a brand entry: hues no brand above
  // uses (violet, magenta, aqua), so they never read as someone's brand.
  const BRAND_FALLBACK = {
    light: ['#4a3aa7', '#e87ba4', '#1baf7a'],
    dark:  ['#9085e9', '#d55181', '#199e70'],
  };
  const NEUTRAL = { light: '#A4A3A8', dark: '#6b6b70' };

  function brandColor(company, theme) {
    const hit = BRAND_COLORS.find(([re]) => re.test(String(company).toUpperCase()));
    return hit ? (theme === 'dark' ? hit[2] : hit[1]) : null;
  }

  // 1234567 -> "1.23 M m"; 45678 -> "45.7 k m"
  function fmtValue(v, unit) {
    if (v == null || isNaN(v)) return '-';
    const u = unit ? ' ' + unit : '';
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(2) + ' M' + u;
    if (a >= 1e3) return (v / 1e3).toFixed(1) + ' k' + u;
    return (Math.round(v * 10) / 10) + u;
  }

  // Axis ticks: 2500000 -> "2.5 M"
  function fmtAxis(v) {
    const a = Math.abs(v);
    if (a >= 1e6) return v / 1e6 + ' M';
    if (a >= 1e3) return v / 1e3 + ' k';
    return v;
  }

  const currentTheme = () => (document.body.classList.contains('dark') ? 'dark' : 'light');

  // Calls cb(theme) when the site's light/dark toggle (body.dark) changes.
  function onThemeChange(cb) {
    let theme = currentTheme();
    new MutationObserver(() => {
      const t = currentTheme();
      if (t !== theme) { theme = t; cb(t); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function fetchJson(url) {
    return fetch(url).then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.json();
    });
  }

  // Title block shared by every chart.
  function title(text, subtext, ink) {
    return {
      text: text || '',
      subtext: subtext || '',
      textStyle: { color: ink.text, fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 16 },
      subtextStyle: { color: ink.muted, fontFamily: 'Poppins, sans-serif' },
    };
  }

  window.MPDChartTheme = {
    PALETTE, INK, SEQUENTIAL, UPDOWN, BRAND_COLORS, BRAND_FALLBACK, NEUTRAL,
    brandColor, fmtValue, fmtAxis, currentTheme, onThemeChange, fetchJson, title,
  };
})();
