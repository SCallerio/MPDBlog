---
title: "Argentina's Drilling and Frac Race: Meters Drilled, Lateral Length and Frac Stages by Operator"
description: "Animated ECharts charts built from Secretaría de Energía open data: meters drilled, lateral length, frac stages and stage spacing per operator in Argentina, by province, basin and month."
author: Santiago Callerio
layout: post
published: false
categories: Data_Analytics
tags: [argentina, vaca muerta, data analytics, interactive visualization, echarts]
excerpt_separator: <!--more-->
---

*Who has drilled the most in Argentina, and how have its frac completions changed? This post turns open data from
the Secretaría de Energía into animated charts: races of cumulative meters drilled and of average lateral length,
frac stages and stage spacing per operator, plus a province map, a basin drill-down, a bubble chart and monthly
activity candles.*

<!--more-->

## How the charts are built

The data is processed in Python with pandas (`script/`) and drawn with
[Apache ECharts](https://echarts.apache.org/examples/en/index.html). The meters-drilled races follow the
[ECharts line race](https://echarts.apache.org/examples/en/editor.html?c=line-race) recipe:

1. Download the CSV from [datos.energia.gob.ar](http://datos.energia.gob.ar/).
2. Sum the value per company and calendar month.
3. Fill in the months without activity with zero, so each line stays flat instead of breaking.
4. Take the cumulative sum over time and keep the eight companies (or fields) with the largest final total.

Their y-axis is logarithmic: YPF is roughly ten times larger than the next operator, and on a linear scale everyone
else would be squashed against the bottom of the chart. The frac races further down show quarterly averages
instead, on a linear axis. Press **Replay** to run any chart again, and hover over it to compare operators.

## Cumulative meters drilled

Monthly meters drilled (`cantidad`) per company (`idempresa`), from January 2009. Pan American Energy appears as two
legal entities in the data, with the LLC (PAE) ending in December 2018 just as Pan American Energy SL starts. Both are
merged here as **PAE**.

{% include line-race.html
     id="metros-line-race"
     data="/data/processed/metros_perforados_cumsum.json"
     title="Cumulative meters drilled by company"
     y_axis="Cumulative meters (log scale)"
     unit="m"
     source_name="Secretaría de Energía — Metros perforados"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Monthly meters drilled (cantidad) summed per company, cumulative."
     brand_colors="true" %}

## YPF: cumulative meters drilled by field

The same meters-drilled data, filtered to YPF (`idempresa` = `YPF`) and split by field (`areayacimiento`), for the
eight fields with the most meters drilled. The dataset reports Loma Campana and the Loma Campana-LLL block as
separate fields.

{% include line-race.html
     id="metros-ypf-line-race"
     data="/data/processed/metros_perforados_ypf_cumsum.json"
     title="YPF: cumulative meters drilled by field"
     y_axis="Cumulative meters (log scale)"
     unit="m"
     source_name="Secretaría de Energía — Metros perforados"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="YPF monthly meters drilled (cantidad) summed per field (areayacimiento), cumulative."
     series_noun="fields" %}

## Longer laterals: average lateral length per well

From here on the frac data is averaged rather than summed: totals mostly measure how many wells a company fractured,
while averages show how its wells are changing. Each point is one company in one quarter, averaged over the
horizontal wells (lateral length > 0) whose frac job ended in that quarter (`fecha_fin_fractura`), per reporting
company (`empresa_informante`), from 2015. Quarters in which a company fractured no horizontal well are bridged
with a straight line.

{% include line-race.html
     id="fractura-lateral-line-race"
     data="/data/processed/fractura_lateral_trimestral.json"
     title="Average lateral length per well, by quarter"
     y_axis="Average lateral length (m)"
     unit="m"
     log="false"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Mean longitud_rama_horizontal_m of the company's horizontal wells fractured in the quarter."
     brand_colors="true"
     color_key="fractura" %}

## More stages: average frac stages per well

The average number of frac stages (`cantidad_fracturas`) per horizontal well, on the same quarters and companies.

{% include line-race.html
     id="fractura-etapas-line-race"
     data="/data/processed/fractura_etapas_trimestral.json"
     title="Average frac stages per well, by quarter"
     y_axis="Average frac stages per well"
     unit="stages"
     log="false"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Mean cantidad_fracturas of the company's horizontal wells fractured in the quarter."
     brand_colors="true"
     color_key="fractura" %}

## Tighter spacing: frac stages per 1,000 m of lateral

Longer laterals naturally carry more stages, so the two charts above partly measure the same thing. Dividing them
removes that: stages per 1,000 m of lateral is the completion intensity. A rising line means stages are being
placed closer together, not just that the wells got longer. For each company and quarter it is the total stages
divided by the total lateral length of its horizontal wells, times 1,000.

{% include line-race.html
     id="fractura-densidad-line-race"
     data="/data/processed/fractura_densidad_trimestral.json"
     title="Frac stages per 1,000 m of lateral, by quarter"
     y_axis="Frac stages per 1,000 m"
     unit="stages/km"
     log="false"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Total stages / total lateral length × 1,000, per company and quarter (horizontal wells)."
     brand_colors="true"
     color_key="fractura" %}

## The same race, as bars

A bar race of the same cumulative meters drilled, for the fifteen largest companies, showing the top ten in each
month. Bars make overtakes easier to follow than lines, and the scale is linear, so the gap between YPF and everyone
else shows at its true size.

{% include energy-chart.html
     kind="bar-race"
     id="metros-bar-race"
     data="/data/processed/metros_perforados_cumsum_top15.json"
     title="Cumulative meters drilled: top 10 companies"
     unit="m"
     height="560px"
     source_name="Secretaría de Energía — Metros perforados"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Monthly meters drilled (cantidad) summed per company, cumulative." %}

## Where the drilling happens: meters drilled by province

Meters drilled per province (`provincia`) in each calendar year. Neuquén, home of Vaca Muerta, is an order of
magnitude above every other province, so the color scale uses fixed, roughly logarithmic bins. That keeps the
smaller provinces visible and makes the colors comparable from year to year. Offshore wells in federal waters
(`Estado Nacional`) have no province, so their total appears in the subtitle instead.

{% include energy-chart.html
     kind="province-map"
     id="metros-province-map"
     data="/data/processed/metros_perforados_provincia_anio.json"
     geo="/assets/data/argentina-provinces.json"
     title="Meters drilled by province"
     height="720px"
     source_name="Secretaría de Energía — Metros perforados"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Meters drilled per province and calendar year. Province outlines: jazzido/Polymaps-Argentina." %}

## Basin, province, company: a drill-down

The same meters, split by basin (`cuenca`), then province, then company. Click a tile to zoom in, use the
breadcrumb to go back up, and pick a year on the timeline (or *All* for the whole period). Small basins are grouped
as *Other basins*, and within a province, companies past the top six as *Other companies*.

{% include energy-chart.html
     kind="treemap"
     id="metros-treemap"
     data="/data/processed/metros_perforados_arbol.json"
     title="Meters drilled: basin › province › company"
     height="640px"
     source_name="Secretaría de Energía — Metros perforados"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Meters drilled (cantidad) by basin, province and company." %}

## Laterals vs. stages, company by company

A Gapminder-style bubble chart of the frac data: each bubble is one company in one year, placed by the average
lateral length (x) and the average number of frac stages (y) of the horizontal wells it fractured, with the bubble
area proportional to the number of those wells. Press play to watch the industry move up and to the right.

{% include energy-chart.html
     kind="bubbles"
     id="fractura-bubbles"
     data="/data/processed/fractura_burbujas.json"
     title="Lateral length vs. frac stages per well"
     height="620px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Horizontal wells (lateral length > 0), grouped by the year the frac job ended. One point per company and year." %}

## Activity candles: month-over-month ups and downs

Candlesticks borrowed from finance, applied to activity: each candle goes from the previous month's value (open) to
this month's (close), blue when activity rose and orange when it fell. The lower panel shows the change itself,
positive or negative. Pick the indicator in the menu:

- **Wells being drilled** each month, the closest official proxy for the active rig count (one rig drills one well
  at a time).
- **Wells completed** per month.
- **Frac stages**, **wells fractured** and **lateral length fractured** per month, from the frac data. These have
  daily dates, so their wicks show the lowest and highest weekly pace within the month.

{% include energy-chart.html
     kind="candles"
     id="activity-candles"
     data="/data/processed/pozos_velas.json,/data/processed/fractura_velas.json"
     title="Activity candles"
     default_indicator="wells_drilling"
     zoom_months="60"
     height="620px"
     source_name="Secretaría de Energía — Perforación de pozos and Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Drag the slider to see the full history." %}

## Data notes

- Companies are shown in their brand colors (YPF blue, Shell yellow, Pan American Energy red, and so on).
- Recent months of the frac data may be revised upward as late reports come in.
- Both datasets are refreshed monthly by GitHub Actions (`update-metros-perforados.yml` and
  `update-fractura.yml`), so the charts stay current without manual work.
- Company names longer than 22 characters are shortened in the labels: for meters drilled they fall back to the
  company code (`idempresa`), and for the frac data legal suffixes are dropped (e.g. "VISTA ENERGY ARGENTINA SAU"
  becomes "VISTA ENERGY").
- The frac dataset has a few records from 2006 onward, but less than 1% of the total comes before 2015, so the frac
  charts start in 2015.
- Quarterly averages for a company can rest on only a handful of wells, so single-quarter jumps are noisy; the trend
  over several quarters is what matters.
