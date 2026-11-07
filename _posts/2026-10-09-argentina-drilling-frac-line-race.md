---
title: "Vaca Muerta at Scale: How Continuous Optimization Is Turning a World-Class Shale Resource into a Global Export Platform"
description: "Fifteen years of open data on drilling, frac and production show how Vaca Muerta moved down the cost curve through factory pad drilling, managed pressure drilling and commoditized completions, and why the Argentina LNG build-out could make it one of the world's main LNG suppliers."
author: Santiago Callerio
layout: post
published: false
categories: Data_Analytics
tags: [argentina, vaca muerta, unconventional, managed pressure drilling, lng, data analytics, interactive visualization, echarts]
excerpt_separator: <!--more-->
---

**Vaca Muerta has crossed from appraisal to industrial scale. Argentina now fractures 3.6 times more stages a year than
it did in 2019 with fewer drilling rigs than in 2015, and the fifteen largest unconventional areas produce roughly
24 times the oil they did a decade ago. The next horizon is no longer technical proof but capital and export
capacity: operators that keep compounding efficiency gains while securing a position in the oil pipeline and LNG
build-out are best placed to capture the value of one of the highest-quality shale resources outside North America.**

<!--more-->

## The market landscape: from resource proof to capital race

Three structural shifts frame the current moment.

**Production has moved to records.** Argentina produced about 887,000 barrels of oil per day in May 2026, an
all-time high and nearly 19% above the year before, with shale accounting for roughly 70% of national output
([Gulf News](https://gulfnews.com/business/energy/argentinas-shale-revolution-hits-new-high-with-record-oil-output-1.500622377),
[Oilprice](https://oilprice.com/Energy/Energy-General/Argentinas-Oil-Production-Soars-as-Vaca-Muerta-Breaks-New-Records.amp.html)).
Activity has concentrated accordingly: Neuquén's share of the meters drilled in the country rose from 18% in 2010
to 85% in 2025, while total national meters drilled stayed broadly flat at about 3 million meters a year. The
industry did not drill more; it redeployed almost all of its effort into one basin.

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

{% include energy-chart.html
     kind="treemap"
     id="metros-treemap"
     data="/data/processed/metros_perforados_arbol.json"
     title="Meters drilled: basin › province › company"
     height="640px"
     source_name="Secretaría de Energía — Metros perforados"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Meters drilled (cantidad) by basin, province and company." %}

**Capital is arriving under a new fiscal framework.** The Large Investment Incentive Regime (RIGI) offers 30 years of
tax, customs and foreign-exchange stability, and energy projects under RIGI review add up to about US$116 billion,
including YPF's LLL Oil (US$25 billion), Chevron's El Trapial (US$13.8 billion), Pluspetrol's Bajo del
Choique-La Invernada (US$12 billion), Vista's Bandurria Norte (US$5.8 billion), Tecpetrol's Los Toldos II Este
(US$2.4 billion) and GeoPark's Loma Jarillosa Este and Puesto Silva Oeste (US$1 billion)
([JPT, 28 August 2026](https://jpt.spe.org/continental-resources-inks-hoa-with-mercuria-energy-for-vaca-muerta-shale-joint-venture),
citing BNAmericas). New entrants are following. Continental Resources and Mercuria signed a heads of agreement for a
50-50 operating joint venture around Phoenix Global Resources, assembling nearly 163,000 net acres in six blocks
with a target of lifting output from 28,000 BOED to more than 100,000 BOED within five years on over US$4 billion of
new capital (same source; the deal still requires definitive agreements and regulatory approvals).

**The binding constraint has shifted from the subsurface to midstream.** The Vaca Muerta Oil Sur (VMOS) pipeline is
designed for 550,000 bbl/d, expandable to 700,000 bbl/d, with a first phase of 180,000 bbl/d
([Industrial Info](https://www.industrialinfo.com/news/article/argentina-breaks-oil-production-record-led-by-vaca-muerta--360725)).
On the gas side, the Argentina LNG project (discussed in the third pillar) would turn a domestic, seasonal market
into an export business.

The operator landscape behind these numbers is concentrated. YPF has drilled more than twice the cumulative meters
of the next operator since 2009, and since 2021 about 90% of the meters it drilled in its eight largest fields went
to its Vaca Muerta blocks: La Amarga Chica, Bandurria Sur and Loma Campana.

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

## Pillar 1 — Near-term capital efficiency: well construction as a factory

The first lever is the cost and cycle time of each well. Vaca Muerta's operators have moved from drilling individual
wells to running a manufacturing system, and the data shows the results in output per rig rather than in rig count.

- **Lever: factory pad drilling and lean execution.** Multi-well pads, batch drilling and standardized well designs
  let rigs walk between wellheads instead of rigging down. YPF's "Toyota Well" program, which applies the Toyota
  production system to well construction, is reported to have cut well construction time by 25% and start-up time by
  71% ([Río Negro](https://www.rionegro.com.ar/energia/gracias-al-toyota-well-ypf-redujo-un-25-el-tiempo-de-construccion-de-pozos-en-vaca-muerta-4355225/)),
  supported by a 24/7 Real Time Intelligence Center that monitors and intervenes in drilling and fracturing remotely
  ([EconoJournal](https://econojournal.com.ar/oilgas/ypf-inauguro-el-real-time-intelligence-center-para-controlar-e-intervenir-la-perforacion-y-fractura-de-sus-pozos-en-vaca-muerta-de-forma-remota/)).
  YPF has reported drilling a 1,747 m horizontal section in under 24 hours
  ([EconoJournal](https://econojournal.com.ar/oilgas/mejora-en-la-competitividad-de-vaca-muerta-ypf-perforo-un-pozo-horizontal-de-1747-metros-en-menos-24-horas/)).
  - *Impact:* Argentina's active rig count averaged about 105 in 2015 and 41 in 2025 (Baker Hughes), yet the
    lateral length fractured per active rig rose roughly 5x between 2019 and 2025, from about 6 km to about 33 km a
    year. Fewer, higher-specification rigs now deliver the basin's growth.
- **Lever: managed pressure drilling (MPD) as a system, not a contingency.** Longer laterals raise equivalent
  circulating density and surge and swab pressures, narrowing an already tight pore-to-fracture window in the
  Quintuco and Vaca Muerta formations. MPD has become standard in the basin for this reason
  ([LM Neuquén](https://mase.lmneuquen.com/vaca-muerta/mpd-la-tecnologia-que-transformo-la-forma-perforar-la-cuenca-neuquina-n1217604)),
  and YPF's five-year, roughly US$600 million award to Archer centers on seven high-specification rigs with
  integrated MPD systems ([Drilling Contractor](https://drillingcontractor.org/archer-wins-five-year-ypf-drilling-award-in-vaca-muerta-76168)).
  As discussed in [Beyond the Bit: How Holistic Managed Pressure Drilling Is Redefining the Well Construction
  Playbook in Vaca Muerta]({% post_url 2025-08-10-holistic-mpd-vaca-muerta %}), extending MPD from influx management to the full well lifecycle can safely extend lateral reach by about 70%, cut
  tripping time in half and take cementing off the critical path.
  - *Impact:* MPD is what makes the step-change in lateral length below drillable at factory pace; without it,
    longer wells would buy reservoir contact at the expense of non-productive time.
- **Lever: wells, not rigs, as the activity unit.** The official count of wells being drilled each month follows the
  rig count through the cycle (correlation of 0.7 since 2013) but has pulled away from it since 2021: with pad
  drilling, each rig works on more than one well a month.
  - *Impact:* Rig count alone now understates activity. Boards tracking the basin should read rigs, wells and frac
    stages together.

{% include energy-chart.html
     kind="candles"
     id="activity-candles"
     data="/data/processed/rig_count_velas.json,/data/processed/pozos_velas.json,/data/processed/fractura_velas.json"
     title="Activity candles"
     default_indicator="rig_count"
     zoom_months="60"
     height="620px"
     source_name="Secretaría de Energía — Perforación de pozos and Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21"
     note="Rig counts: Baker Hughes Worldwide Rig Count (rigcount.bakerhughes.com), monthly reports of July 2025 and September 2026 and the 2007–2024 regional history. Drag the slider to see the full history." %}

The well register shows the same shift in the location of activity. Unconventional wells were 4% of the wells
drilled in Argentina in 2010 and about two-thirds in 2025, as conventional drilling fell from about 1,500 wells to
about 200 a year. The growth is concentrated in a few core areas: Loma Campana alone accounts for more than 880 of
the roughly 4,900 unconventional wells drilled since 2010, followed by La Amarga Chica and Bandurria Sur.

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

## Pillar 2 — Medium-term structural margin: completion intensity at commodity cost

The second lever is the completion, which is the largest single cost of a shale well. Vaca Muerta operators have
increased completion intensity on every axis while working to turn the frac itself into a commodity service.

- **Lever: more reservoir contact per well.** YPF's average lateral length rose from about 1,170 m in early 2015 to
  about 3,300 m in 2026, a 2.8x increase, and its average frac stages per well from about 15 to about 58 (3.8x).
  The rest of the peer group, including Vista, Pluspetrol, Pan American Energy and TotalEnergies, has converged on
  laterals of about 3,000 m.
  - *Impact:* Each well drains more rock for a largely fixed surface and drilling-mobilization cost, which shifts
    the basin down the cost curve per barrel.
- **Lever: tighter stage spacing.** Completion intensity, measured as stages per 1,000 m of lateral, rose from about
  13 to about 17 for YPF over the same period, with most operators converging between about 15 and 17.5.
  - *Impact:* Stage density is now an optimization variable rather than a step to be pushed: the convergence
    suggests the industry is near the spacing that maximizes return for current well spacing and pricing.
- **Lever: frac as a commodity.** National frac activity reached a record 2,616 stages in March 2026, with simul-frac
  pumping up to about 60% more stages per day than conventional zipper fracturing
  ([El Economista](https://eleconomista.com.ar/energia/vaca-muerta-modo-record-fracking-alcanza-2616-etapas-podria-superar-30000-ano-n93828)).
  About 15 frac fleets now serve the basin ([World Oil](https://worldoil.com/news/2026/8/11/tenaris-deploys-third-vaca-muerta-fracing-fleet-after-110-million-investment/)),
  local sand supply has expanded, and wet-sand pilots have reduced the cost per tonne of processed proppant
  ([SLB, with Vista](https://www.slb.com/resource-library/case-study-with-navigation/rpst/wet-sand-fracturing-vista-energy-argentina-vaca-muerta-basin-cs)).
  Switching fleets from diesel to local gas is estimated by one supplier at about US$30 million a year per fleet
  ([LM Neuquén](https://mase.lmneuquen.com/vaca-muerta-marcelo-guiscardo-ahorro-sets-fractura)).
  - *Impact:* Frac stages pumped in Argentina rose from about 6,300 in 2019 to about 22,500 in 2025, a 3.6x increase,
    while the number of wells fractured rose only about 1.4x. Forecasts point to about 28,000 stages in 2026 and
    about 39,000 in 2027 ([El Economista](https://eleconomista.com.ar/energia/fucello-vaca-muerta-ya-demostro-recurso-ahora-debe-demostrar-escala-n98006)).

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

The relative positions of operators matter as much as the averages. The bubble chart maps each operator's lateral
length against its stage count over time; the radar compares the main areas on the same completion metrics; and the
calendar shows the operating tempo, stage by stage, that factory completions require.

{% include energy-chart.html
     kind="bubbles"
     id="fractura-bubbles"
     data="/data/processed/fractura_burbujas.json"
     title="Lateral length vs. frac stages per well"
     height="620px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Horizontal wells (lateral length > 0), grouped by the year the frac job ended. One point per company and year." %}

{% include energy-chart.html
     kind="radar"
     id="fractura-radar"
     data="/data/processed/fractura_radar.json"
     title="Horizontal wells fractured in the main areas"
     height="600px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Horizontal wells (lateral length > 0) by the year the frac job ended." %}

{% include energy-chart.html
     kind="calendar"
     id="fractura-calendar"
     data="/data/processed/fractura_calendario.json"
     title="Frac stages per day"
     height="590px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Stages spread evenly from fecha_inicio_fractura to fecha_fin_fractura; the color scale tops out at the 98th percentile day." %}

Year over year, growth has been uneven across operators and areas, and the flow from operators to the areas they
complete shows how concentrated the completion market remains.

{% include energy-chart.html
     kind="change-treemap"
     id="fractura-change-treemap"
     data="/data/processed/fractura_arbol_cambio.json"
     title="Frac activity by company and area: year-over-year change"
     height="640px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Companies by frac stages in the last full year; within each, the top six areas and the rest as Other areas." %}

{% include energy-chart.html
     kind="sankey"
     id="fractura-sankey"
     data="/data/processed/fractura_sankey.json"
     title="Frac stages: company → area"
     height="640px"
     source_name="Secretaría de Energía — Datos de fractura de pozos (Adjunto IV)"
     source_url="http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7"
     note="Total cantidad_fracturas per company and areapermisoconcesion since 2015." %}

## Pillar 3 — Long-term portfolio value: scale, blocks and export monetization

The third lever is how the resource is monetized. The first two pillars lowered the cost of each barrel and each
cubic meter; the value now depends on where the next increments come from and whether they can reach export
markets.

- **Lever: core-area development and the next wave of blocks.** Unconventional oil from the fifteen largest areas rose
  from about 23,500 bbl/d at the end of 2015 to about 573,000 bbl/d in August 2026. Loma Campana led alone in 2015;
  today Loma Campana (about 92,000 bbl/d), La Amarga Chica (about 83,000), Bandurria Sur (about 72,000), Bajada del
  Palo Oeste (about 59,000) and Bajo del Choique-La Invernada (about 47,000) form a multi-operator core. Gas from the
  leading areas grew from about 21 to about 89 MMm³/d over the same period, led by Fortín de Piedra (about 20.5
  MMm³/d).
  - *Impact:* The core has broadened from one flagship to a portfolio, which de-risks basin-level growth. The
    RIGI-backed projects and the Continental–Mercuria blocks extend it further into acreage that is only beginning
    to appear in the production data.

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

- **Lever: block access and partnering.** The provincial block map shows who holds the acreage, under which contract
  type, and where unconventional production and wells sit relative to the oil, wet-gas and dry-gas windows. Four of
  the Continental–Mercuria joint venture's six blocks are on it, including Mata Mora Norte, which produced about
  14,000 bbl/d of unconventional oil over the last twelve months.
  - *Impact:* With the core largely held, the next value pools sit in exploration permits and underdeveloped
    concessions, where partnering structures and RIGI qualification will decide the pace of development.

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

- **Lever: LNG as the upside option.** YPF's "4x4" strategy rests on four pillars, with the Argentina LNG export
  project alongside the acceleration of Vaca Muerta
  ([YPF Form 20-F, FY2025](https://www.sec.gov/Archives/edgar/data/904851/000119312526126363/d95578d20f.htm)). The
  project's first stage, with Eni and XRG, is designed around two 6 MTPA floating LNG units for 12 MTPA in total,
  with YPF retaining 36% and Eni and XRG holding 32% each
  ([Pipeline & Gas Journal](https://pgjonline.com/news/2026/february/ypf-eni-xrg-advance-12-mmtpy-argentina-lng-toward-fid)).
  With a reported cost of about US$51 billion, the project had 27 of its 28 required contracts agreed as of early
  November 2026 and a final investment decision targeted for late November, with first cargo expected around 2030
  ([The Rio Times](https://www.riotimesonline.com/argentina-ypf-argentina-lng-27-of-28-contracts-2026/),
  [Latin Times](https://www.latintimes.com/ypf-argentina-lng-project-offtake-contracts-600874)). Separately, a
  27 MMm³/d pipeline from Tratayén to the Southern Energy consortium's floating LNG vessel is targeted for mid-2028
  ([NGI](https://naturalgasintel.com/news/ypf-eyes-year-end-pipeline-fid-as-vaca-muerta-natural-gas-expansion-advances/)).
  - *Impact:* LNG would decouple gas development from Argentina's seasonal domestic demand and give the dry- and
    wet-gas windows an export outlet. If the build-out proceeds, it would place Vaca Muerta among the world's
    significant LNG supply sources by the early 2030s. The milestones are still ahead, and execution risk on
    financing, offtake and construction remains material.

## The path forward

The basin's economics are now proven; the open question is who converts them into durable returns. Three
diagnostic questions can help boards and management teams prioritize:

1. **Is our well-construction system improving at the basin's rate?** Compare lateral meters and stages delivered
   per rig and per frac fleet against the leaders, and test whether MPD, pad design and real-time operations are
   deployed as one system or as separate projects.
2. **Where are we on the completion cost curve, and what is still not commoditized?** Separate the gains already
   captured from intensity (lateral length and stage density) from those still available through fleet energy,
   sand logistics and simul-frac utilization.
3. **Is our portfolio positioned for the export window?** Assess which acreage can access VMOS oil capacity and LNG
   gas offtake on the current timeline, and what partnering or RIGI structures would accelerate it.

The public data will show the answers first, as rigs, frac stages and wells, and then as production. The charts
in this post are refreshed monthly so that progress can be tracked as it happens.

## About the data

- **Sources.** Secretaría de Energía open data ([datos.energia.gob.ar](http://datos.energia.gob.ar/)): meters
  drilled, wells being drilled and completed, frac data (Adjunto IV), production by well and the well register
  (Capítulo IV). Neuquén blocks and Vaca Muerta fluid windows: the Neuquén Ministry of Energy's public GeoServer.
  Rig counts: the [Baker Hughes Worldwide Rig Count](https://rigcount.bakerhughes.com/intl-rig-count) (*WW Monthly*,
  Latin America, Argentina, active rigs; July 2025 and September 2026 reports and the 2007–2024 regional history).
- **Method.** Data is processed in Python with pandas (`script/`) and drawn with
  [Apache ECharts](https://echarts.apache.org/examples/en/index.html). Meters-drilled races are cumulative sums per
  company with a logarithmic axis, because YPF is roughly ten times larger than most operators. Frac races are
  trailing four-quarter averages over horizontal wells by the date the frac job ended, from 2015; points resting on
  fewer than three wells are left out. Pan American Energy's two legal entities are merged as PAE. Production is
  converted to daily rates and covers unconventional wells only.
- **Caveats.** Recent months of the frac data may be revised upward as late reports come in. Baker Hughes counts all
  active rigs in Argentina, conventional included, and has no Argentina row for April 2020 (shown as zero). The
  per-rig and per-fleet ratios above are indicative, since rigs and fleets are not mapped one-to-one to wells.
  Company colors follow their brand colors. All datasets are refreshed monthly by GitHub Actions.
