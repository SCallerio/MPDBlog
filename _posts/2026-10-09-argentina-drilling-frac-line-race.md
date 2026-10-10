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
frac stages and stage spacing per operator, plus a province map, a basin drill-down, a bubble chart, an area radar,
a frac calendar, a year-over-year treemap, a Sankey diagram, production races by area, a map of every well
drilled since 2010 and monthly activity candles.*

<!--more-->

## Continental and Mercuria team up in Vaca Muerta

In August, Continental Resources, the largest privately held E&P company in the US, signed a heads of agreement with
Mercuria Energy Group to run Phoenix Global Resources as a 50-50 operating joint venture
([JPT, 28 August 2026](https://jpt.spe.org/continental-resources-inks-hoa-with-mercuria-energy-for-vaca-muerta-shale-joint-venture)).
Phoenix brings its interests in Mata Mora Norte, Mata Mora Sur, Confluencia Norte and Confluencia Sur, Continental
brings its operated interest in Los Toldos II Oeste, and the partners plan to buy more of Bajo del Toro Este from
Integra Capital: nearly 163,000 net acres in six blocks. The target is to take Phoenix from 28,000 BOED to more than
100,000 BOED within five years, with over US$4 billion of new capital. The deal is not closed yet; it still needs
definitive agreements and regulatory approvals.

Doug Lawler, Continental's CEO, said the reforms of President Milei's government are what brought the company to
Argentina. One of them is the Large Investment Incentive Regime (RIGI), which the joint venture expects to qualify
for: 30 years of tax, customs and foreign-exchange stability for projects that invest at least 40% of an agreed
minimum within two years. JPT, citing BNAmericas, puts the energy projects under RIGI review at US$116 billion,
including YPF's LLL Oil (US$25 billion), Chevron's El Trapial (US$13.8 billion), Pluspetrol's Bajo del
Choique-La Invernada (US$12 billion), Vista's Bandurria Norte (US$5.8 billion), Tecpetrol's Los Toldos II Este
(US$2.4 billion) and GeoPark's Loma Jarillosa Este and Puesto Silva Oeste (US$1 billion).

All of those blocks are on the [Neuquén block map](#neuquén-blocks-and-the-vaca-muerta-fluid-windows) further down,
and so are four of the joint venture's six: Mata Mora Norte, which produced about 14,000 bbl/d of unconventional
oil over the last twelve months, Los Toldos II Oeste, and the exploration permits Mata Mora Sur and Bajo del Toro
Este. If these plans go ahead, the public data will show them first as more rigs and frac crews, and then as
production.

## Data and method

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

## Meters drilled by operator since 2009

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

## Where YPF drills

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

## Lateral length per well

From here on the frac data is averaged rather than summed: totals mostly measure how many wells a company fractured,
while averages show how its wells are changing. Each point is one company at the end of one quarter, averaged over
the horizontal wells (lateral length > 0) whose frac job ended (`fecha_fin_fractura`) in the trailing four quarters,
per reporting company (`empresa_informante`), from 2015. A single quarter can rest on one or two wells, so the
12-month window keeps the lines readable; points based on fewer than three wells are left out, which shows as a
gap in the line.

{% include line-race.html
     id="fractura-lateral-line-race"
     data="/data/processed/fractura_lateral_trimestral.json"
     title="Average lateral length per well (trailing 12 months)"
     y_axis="Average lateral length (m)"
     unit="m"
     log="false"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Mean longitud_rama_horizontal_m of the company's horizontal wells fractured in the trailing four quarters."
     brand_colors="true"
     color_key="fractura" %}

## Frac stages per well

The average number of frac stages (`cantidad_fracturas`) per horizontal well, with the same trailing four-quarter
window and companies.

{% include line-race.html
     id="fractura-etapas-line-race"
     data="/data/processed/fractura_etapas_trimestral.json"
     title="Average frac stages per well (trailing 12 months)"
     y_axis="Average frac stages per well"
     unit="stages"
     log="false"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Mean cantidad_fracturas of the company's horizontal wells fractured in the trailing four quarters."
     brand_colors="true"
     color_key="fractura" %}

## Stages per 1,000 m of lateral

Longer laterals naturally carry more stages, so the two charts above partly measure the same thing. Dividing them
removes that: stages per 1,000 m of lateral is the completion intensity. A rising line means stages are being
placed closer together, not just that the wells got longer. For each company and quarter it is the total stages
divided by the total lateral length of its horizontal wells in the trailing four quarters, times 1,000.

{% include line-race.html
     id="fractura-densidad-line-race"
     data="/data/processed/fractura_densidad_trimestral.json"
     title="Frac stages per 1,000 m of lateral (trailing 12 months)"
     y_axis="Frac stages per 1,000 m"
     unit="stages/km"
     log="false"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Total stages / total lateral length × 1,000 over the trailing four quarters (horizontal wells)."
     brand_colors="true"
     color_key="fractura" %}

## The ten biggest drillers, month by month

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

## Meters drilled by province

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

## Basins, provinces and operators

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

## Lateral length against stage count

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

## The busiest frac areas

A radar of the eight concession areas (`areapermisoconcesion`) with the most horizontal wells fractured since 2015.
Each spoke is one area and the polygon shows how many wells were fractured there in the selected year, with the
previous year dashed for comparison. All spokes share one scale, so a longer spoke means more wells.

{% include energy-chart.html
     kind="radar"
     id="fractura-radar"
     data="/data/processed/fractura_radar.json"
     title="Horizontal wells fractured in the main areas"
     height="600px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Horizontal wells (lateral length > 0) by the year the frac job ended." %}

## Stages pumped per day

Frac stages pumped per day over the last three years. The dataset gives a start and an end date for each frac job,
so each well's stages are spread evenly across its job; jobs with a missing start date count on their end date.
Weekends, holidays and slow periods stand out as pale cells.

{% include energy-chart.html
     kind="calendar"
     id="fractura-calendar"
     data="/data/processed/fractura_calendario.json"
     title="Frac stages per day"
     height="590px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Stages spread evenly from fecha_inicio_fractura to fecha_fin_fractura; the color scale tops out at the 98th percentile day." %}

## Year-over-year change by operator and area

In the style of the [ECharts "Obama budget" treemap](https://echarts.apache.org/examples/en/editor.html?c=treemap-obama):
each tile is a company, split into its areas. Tile size is last full year's total, and the color is the change from
the year before: blue for growth, orange for decline, gray for little change. Switch between frac stages and lateral
length with the legend.

{% include energy-chart.html
     kind="change-treemap"
     id="fractura-change-treemap"
     data="/data/processed/fractura_arbol_cambio.json"
     title="Frac activity by company and area: year-over-year change"
     height="640px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Companies by frac stages in the last full year; within each, the top six areas and the rest as Other areas." %}

## Which operators frac where

All frac stages since 2015, flowing from the companies that pumped them to the areas where they were pumped. The
eight companies and twelve areas with the most stages are shown; the rest are grouped. Hover over a company or an
area to highlight its flows.

{% include energy-chart.html
     kind="sankey"
     id="fractura-sankey"
     data="/data/processed/fractura_sankey.json"
     title="Frac stages: company → area"
     height="640px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Total cantidad_fracturas per company and areapermisoconcesion since 2015." %}

## Unconventional production by area

Monthly production of unconventional wells per concession area (`areapermisoconcesion`), converted to daily rates,
for the fifteen areas that reached the highest rates. Each area is colored by its main operator (the company with the
most production there). On the left, the bar race ranks the top ten in each month; on the right, the line race
draws the history of the eight biggest areas today, so you can see both who leads at any moment and how each one
got there.

<div style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-start;">
<div style="flex:1 1 480px; min-width:0;">
{% include energy-chart.html
     kind="bar-race"
     id="produccion-petroleo-bar-race"
     data="/data/processed/produccion_petroleo_areas.json"
     title="Unconventional oil production by area"
     unit="bbl/d"
     series_noun="areas"
     height="560px"
     source_name="Secretaría de Energía — Producción de petróleo y gas por pozo (Capítulo IV)"
     source_url="http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c"
     note="prod_pet (m³ per month) × 6.29 / days in the month; unconventional wells only." %}
</div>
<div style="flex:1 1 480px; min-width:0;">
{% include line-race.html
     id="produccion-petroleo-line-race"
     data="/data/processed/produccion_petroleo_areas.json"
     title="Unconventional oil production over time"
     y_axis="Oil production (bbl/d)"
     unit="bbl/d"
     log="false"
     top="8"
     brand_colors="true"
     duration_ms="24000"
     series_noun="areas"
     source_name="Secretaría de Energía — Producción de petróleo y gas por pozo (Capítulo IV)"
     source_url="http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c"
     note="Top eight areas by latest rate." %}
</div>
</div>

The same pair for gas:

<div style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-start;">
<div style="flex:1 1 480px; min-width:0;">
{% include energy-chart.html
     kind="bar-race"
     id="produccion-gas-bar-race"
     data="/data/processed/produccion_gas_areas.json"
     title="Unconventional gas production by area"
     unit="MMm³/d"
     series_noun="areas"
     height="560px"
     source_name="Secretaría de Energía — Producción de petróleo y gas por pozo (Capítulo IV)"
     source_url="http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c"
     note="prod_gas (thousand m³ per month) / 1,000 / days in the month; unconventional wells only." %}
</div>
<div style="flex:1 1 480px; min-width:0;">
{% include line-race.html
     id="produccion-gas-line-race"
     data="/data/processed/produccion_gas_areas.json"
     title="Unconventional gas production over time"
     y_axis="Gas production (MMm³/d)"
     unit="MMm³/d"
     log="false"
     top="8"
     brand_colors="true"
     duration_ms="24000"
     series_noun="areas"
     source_name="Secretaría de Energía — Producción de petróleo y gas por pozo (Capítulo IV)"
     source_url="http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c"
     note="Top eight areas by latest rate." %}
</div>
</div>

## Wells drilled since 2010

How Vaca Muerta filled up, year by year. Each dot is a well whose drilling started since 2010
(`adjiv_fecha_inicio_perf`), placed at its location from the Capítulo IV well register: in the blog's accent orange for unconventional,
in the text color for conventional (`tipo_recurso`), with the wells drilled in the selected year drawn larger. The concession areas
are shaded by the unconventional wells drilled in them so far, and the bars on the right rank the areas by that
same count. Press play or drag the year slider; the map keeps your zoom and position from one year to the next.
It opens on the core of Vaca Muerta, but you can drag it to the rest of the country.

{% include energy-chart.html
     kind="wells-map"
     id="pozos-mapa"
     data="/data/processed/pozos_mapa.json"
     geo="/assets/data/argentina-provinces.json,/assets/data/argentina-concesiones.json"
     title="Wells drilled since 2010 in Vaca Muerta and beyond"
     height="760px"
     source_name="Secretaría de Energía — Producción de petróleo y gas por pozo (Capítulo IV)"
     source_url="http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c"
     note="Wells with a drilling start date since 2010. Concession outlines: Secretaría de Energía, Concesiones de Explotación." %}

## Neuquén blocks and the Vaca Muerta fluid windows

Every hydrocarbon block in Neuquén, as published by the province's Ministry of Energy, with the Vaca Muerta fluid
windows drawn on top as dashed outlines. Use the menu to color the blocks by operator (brand colors), by contract
type, or by unconventional oil, gas or wells drilled; hover over a block for its holders and their shares, its area
and its contract dates. Production and wells come from the national Capítulo IV files, matched to the blocks by name.

{% include energy-chart.html
     kind="vm-blocks"
     id="vaca-muerta-blocks"
     data="/data/processed/neuquen_areas.json"
     geo="/assets/data/argentina-provinces.json,/assets/data/neuquen-areas.json"
     title="Neuquén hydrocarbon blocks"
     height="760px"
     source_name="Ministerio de Energía y Recursos Naturales del Neuquén — GeoServer de Hidrocarburos (blocks, fluid windows); Secretaría de Energía — Capítulo IV (production, wells)"
     source_url="https://hidrocarburos.energianeuquen.gob.ar/gis"
     note="Blocks and fluid windows simplified for the web." %}

## Month-over-month activity

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

## Notes on the data

- Companies are shown in their brand colors (YPF blue, Shell yellow, Pan American Energy red, and so on).
- Recent months of the frac data may be revised upward as late reports come in.
- All datasets are refreshed monthly by GitHub Actions (`update-metros-perforados.yml`, `update-fractura.yml` and
  `update-produccion.yml`), so the charts stay current without manual work.
- The production races cover unconventional wells only, the scope of the per-well production file used. The well
  map shows wells with a drilling start date since 2010; older wells in the register have no drilling dates.
- Maps: province outlines from [jazzido/Polymaps-Argentina](https://github.com/jazzido/Polymaps-Argentina);
  concession areas from the Secretaría de Energía's *Concesiones de Explotación* shapefile; Neuquén blocks and Vaca
  Muerta fluid windows from the [Neuquén Ministry of Energy's GeoServer](https://hidrocarburos.energianeuquen.gob.ar/gis);
  well locations from the *Capítulo IV* well register and its shapefile. All are simplified for the web.
- Company names longer than 22 characters are shortened in the labels: for meters drilled they fall back to the
  company code (`idempresa`), and for the frac data legal suffixes are dropped (e.g. "VISTA ENERGY ARGENTINA SAU"
  becomes "VISTA ENERGY").
- The frac dataset has a few records from 2006 onward, but less than 1% of the total comes before 2015, so the frac
  charts start in 2015.
- The frac averages use a trailing four-quarter window and need at least three wells per point; even so, a company
  with few wells moves more than YPF, whose averages rest on hundreds.
