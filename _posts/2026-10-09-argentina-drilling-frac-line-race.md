---
title: "Argentina's Drilling and Frac Race: Meters Drilled, Lateral Length and Frac Stages by Operator"
description: "Animated ECharts line races built from Secretaría de Energía open data: cumulative meters drilled, horizontal lateral length and frac stages per operator in Argentina."
author: Santiago Callerio
layout: post
published: false
categories: Data_Analytics
tags: [argentina, vaca muerta, data analytics, interactive visualization, echarts]
excerpt_separator: <!--more-->
---

*Who has drilled the most in Argentina, and who is pumping the most frac stages? This post turns open data from the
Secretaría de Energía into animated "line races": the cumulative meters drilled, the cumulative horizontal lateral
length and the cumulative frac stages for the top eight operators, month by month, plus a closer look at where the
market leader, YPF, has drilled.*

<!--more-->

## How the charts are built

Each chart follows the same recipe, implemented in Python with pandas
(`script/line_race_data.py`) and drawn with the
[Apache ECharts line race](https://echarts.apache.org/examples/en/editor.html?c=line-race):

1. Download the CSV from [datos.energia.gob.ar](http://datos.energia.gob.ar/).
2. Sum the value per company and calendar month.
3. Fill in the months without activity with zero, so each line stays flat instead of breaking.
4. Take the cumulative sum over time and keep the eight companies (or fields) with the largest final total.

The y-axis is logarithmic: YPF is roughly ten times larger than the next operator, and on a linear scale everyone
else would be squashed against the bottom of the chart. Press **Replay** to run a race again, and hover over the
chart to compare all operators in a given month.

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
     note="Monthly meters drilled (cantidad) summed per company, cumulative." %}

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
     note="YPF monthly meters drilled (cantidad) summed per field (areayacimiento), cumulative." %}

## Cumulative lateral length

Horizontal lateral length (`longitud_rama_horizontal_m`) of each fractured well, by the month the frac job ended
(`fecha_fin_fractura`), per reporting company (`empresa_informante`), from January 2015. Vertical wells report a
lateral length of zero, so they count towards the frac stages below but not here.

{% include line-race.html
     id="fractura-lateral-line-race"
     data="/data/processed/fractura_lateral_cumsum.json"
     title="Cumulative lateral length by company"
     y_axis="Cumulative lateral length, m (log scale)"
     unit="m"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Horizontal lateral length per fractured well, by frac end month, cumulative."
     color_key="fractura" %}

## Cumulative frac stages

Number of frac stages (`cantidad_fracturas`) per well, on the same time axis and company grouping.

{% include line-race.html
     id="fractura-etapas-line-race"
     data="/data/processed/fractura_etapas_cumsum.json"
     title="Cumulative frac stages by company"
     y_axis="Cumulative frac stages (log scale)"
     unit="stages"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Frac stages per well, by frac end month, cumulative."
     color_key="fractura" %}

## Data notes

- Both datasets are refreshed monthly by GitHub Actions (`update-metros-perforados.yml` and
  `update-fractura.yml`), so the charts stay current without manual work.
- Company names longer than 22 characters are shortened in the labels: for meters drilled they fall back to the
  company code (`idempresa`), and for the frac data legal suffixes are dropped (e.g. "VISTA ENERGY ARGENTINA SAU"
  becomes "VISTA ENERGY").
- The frac dataset has a few records from 2006 onward, but less than 1% of the total comes before 2015, so the frac
  races start in January 2015. Their totals still include the earlier records, which is why the lines don't start
  at zero.
