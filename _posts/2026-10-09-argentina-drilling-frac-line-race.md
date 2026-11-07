---
title: "Vaca Muerta at Scale: How Continuous Optimization Is Turning a World-Class Shale Resource into a Global Export Platform"
description: "Fifteen years of open data on drilling, frac and production show how Vaca Muerta moved down the cost curve through factory pad drilling, managed pressure drilling and commoditized completions, and why the Argentina LNG build-out could make it one of the world's main LNG suppliers, with insights from IAPG Houston's Shale in Argentina 2026 conference and the IAPG's new resource estimate."
author: Santiago Callerio
layout: post
published: false
categories: Data_Analytics
tags: [argentina, vaca muerta, unconventional, managed pressure drilling, lng, data analytics, interactive visualization, echarts]
excerpt_separator: <!--more-->
image: {path: "/images/iapgh-2026-shale-in-argentina_bw.jpg", width: 2000, height: 1500, alt: "The author on stage at IAPG Houston's Shale in Argentina 2026 conference"}
image_position: 40%
image_caption: 'IAPG Houston, Shale in Argentina 2026 (Houston, 3 September 2026). Photo by Santiago Callerio'
---

**Vaca Muerta has crossed from appraisal to industrial scale. Argentina now fractures 3.6 times more stages a year than
it did in 2019 with fewer drilling rigs than in 2015, and the fifteen largest unconventional areas produce roughly
24 times the oil they did a decade ago, yet less than 2% of the formation's estimated recoverable oil has been
produced. The next horizon is no longer technical proof but capital and export capacity: operators that keep compounding efficiency gains while securing a position in the oil pipeline and LNG
build-out over the next 24 months are best placed to capture the value of one of the highest-quality shale resources
outside North America.**

<!--more-->

{% include stat-tiles.html group="headline" %}

{% include takeaway.html title="Main takeaways" items="**The rock is first tier, and barely tapped.** About 30 billion barrels of oil remain technically recoverable, and less than 2% has been produced; productivity per lateral foot rivals the best US plays.||**Efficiency, not rig count, drives growth.** Factory pad drilling, rig-integrated MPD and real-time operations let about 40 rigs deliver what more than 100 could not a decade ago.||**Completions have scaled at commodity cost.** Laterals are almost three times longer and stages per well almost four times higher than in 2015, but sand logistics and a roughly 30% well-cost premium over the Permian are still to be closed.||**The constraint is now midstream and capital.** Pipeline capacity, LNG and the durability of RIGI will decide whether production can double by 2030; the next 24 months set the pace." %}

## The market landscape: from resource proof to capital race

Four structural shifts frame the current moment.

**Production has moved to records.** Argentina produced about 887,000 barrels of oil per day in May 2026, an
all-time high and nearly 19% above the year before, with shale accounting for roughly 70% of national output
([Gulf News](https://gulfnews.com/business/energy/argentinas-shale-revolution-hits-new-high-with-record-oil-output-1.500622377),
[Oilprice](https://oilprice.com/Energy/Energy-General/Argentinas-Oil-Production-Soars-as-Vaca-Muerta-Breaks-New-Records.amp.html)).
Activity has concentrated accordingly: Neuquén's share of the meters drilled in the country rose from 18% in 2010
to 85% in 2025, while total national meters drilled stayed broadly flat at about 3 million meters a year. The
industry did not drill more; it redeployed almost all of its effort into one basin.

{% include stat-tiles.html group="landscape" %}

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

**The resource is deeper than the production record suggests.** A July 2026 study by the IAPG's Exploration and
Development Commission, prepared at the Secretaría de Energía's request with seven operators and two universities,
estimates Vaca Muerta's remaining technically recoverable oil at 30.2 billion barrels in its best estimate (18.1
billion low, 45.1 billion high) as of the end of 2024
(IAPG, *Estimación de los Recursos Remanentes Técnicamente Recuperables de Petróleo de la Fm. Vaca Muerta*). Only
558 million barrels had been produced by then. Of the remaining volume, 4.5 billion barrels are reserves, 3.6
billion contingent resources and 22.0 billion prospective resources, normalized to wells with 3,000 m laterals at
300 m spacing. Roughly three-quarters of the prize is still to be appraised, which keeps exploration and
appraisal, and not only development, at the center of capital allocation. Set against the US benchmarks presented
at IAPG Houston's *Shale in Argentina 2026* conference (Houston, 3 September 2026), Vaca Muerta's mid-case remaining
oil approaches the Midland Basin's and is about three times the Eagle Ford's, and its remaining gas, at roughly
260 Tcf in the mid case, exceeds the Delaware Basin's; YPF's keynote placed it fourth among the world's shale oil
resources and second for shale gas.<sup><a href="#about-the-data">1</a></sup> In S&P Global Energy's assessment at the same event, peak
productivity per 1,000 lateral feet now rivals the premier US oil and gas plays, oil recovery per foot is among the
highest of the group, and wellhead breakevens of about US$35–40/bbl for oil and about US$2/Mcf for gas sit within
the US range: "the remaining discount is increasingly above ground and midstream, not geological."<sup><a href="#about-the-data">1</a></sup>

{% include energy-chart.html
     kind="bars"
     id="iapgh-size-of-prize"
     data="/data/processed/iapgh2026_size_of_prize.json"
     title="Vaca Muerta against the main US shale basins"
     height="540px"
     source_name="IAPG reports and Pickering Energy Partners, as shown at IAPG Houston's Shale in Argentina 2026"
     source_url="#about-the-data"
     note="Re-plotted from the conference slide; US-basin values read from the chart and approximate. Vaca Muerta oil: IAPG, July 2026." %}

**Capital is arriving under a new fiscal framework.** The Large Investment Incentive Regime (RIGI) offers 30 years of
tax, customs and foreign-exchange stability, and energy projects under RIGI review add up to about US$116 billion,
including YPF's LLL Oil (US$25 billion), Chevron's El Trapial (US$13.8 billion), Pluspetrol's Bajo del
Choique-La Invernada (US$12 billion), Vista's Bandurria Norte (US$5.8 billion), Tecpetrol's Los Toldos II Este
(US$2.4 billion) and GeoPark's Loma Jarillosa Este and Puesto Silva Oeste (US$1 billion)
([JPT, 28 August 2026](https://jpt.spe.org/continental-resources-inks-hoa-with-mercuria-energy-for-vaca-muerta-shale-joint-venture),
citing BNAmericas). New entrants are following. Continental Resources and Mercuria signed a heads of agreement for a
50-50 operating joint venture around Phoenix Global Resources, assembling nearly 163,000 net acres in six blocks
with a target of lifting output from 28,000 BOED to more than 100,000 BOED within five years on over US$4 billion of
new capital (same source; the deal still requires definitive agreements and regulatory approvals). Across all
industries, S&P Global Energy counted about US$200 billion in RIGI applications as of August 2026: 21 approved
projects worth US$47 billion, including VMOS, Southern Energy LNG, Rincón de Aranda and the Perito Moreno pipeline
expansion, and 22 pending projects worth US$152 billion, including Argentina LNG, TGS's NGL project, the LLL oil
cluster and Bandurria Norte.<sup><a href="#about-the-data">1</a></sup> The cost of capital is following: Argentina's sovereign spread on the JP
Morgan EMBI fell from about 2,600 basis points in 2023 to about 500 by mid-2026, and S&P Global's above-ground risk
ranking of 113 countries shows Argentina climbing since 2014, with the potential to reach the top 10% by 2031.<sup><a href="#about-the-data">1</a></sup>
In his Houston keynote, YPF CEO Horacio Marín framed the scale of the effort: about US$130 billion of cumulative
investment in Vaca Muerta between 2025 and 2031, lifting Argentina to about 1.7 million bbl/d of oil (about 2.2
times 2025) and 250 MMm³/d of gas (about 1.9 times) from 2031, with additional exports above US$30 billion a year
and an energy trade surplus of about US$45 billion.<sup><a href="#about-the-data">1</a></sup>

{% include stat-tiles.html group="capital" %}

{% include energy-chart.html
     kind="bars"
     id="vm-investment-projects"
     data="/data/processed/vm_investment_projects.json"
     title="The project pipeline: announced and submitted investments"
     height="560px"
     source_name="JPT/BNAmericas; YPF, TGS and Camuzzi at IAPG Houston 2026; Reuters"
     source_url="#about-the-data"
     note="Amounts as cited in this post; they cover different time spans and should not be added up." %}

**The binding constraint has shifted from the subsurface to midstream.** The Vaca Muerta Oil Sur (VMOS) pipeline is
designed for 550,000 bbl/d, expandable to 700,000 bbl/d, with a first phase of 180,000 bbl/d
([Industrial Info](https://www.industrialinfo.com/news/article/argentina-breaks-oil-production-record-led-by-vaca-muerta--360725)).
In Houston, Marín reported the US$3 billion-plus pipeline to Punta Colorada as about 80% complete, with first
loading planned for January 2027 and capacity ramping from about 180,000 bbl/d in the first quarter of 2027 to about
390,000 and 550,000 bbl/d later that year and about 700,000 bbl/d from 2028, worth roughly US$4.6 billion, US$10.0
billion, US$14.1 billion and US$17.9 billion a year in exports at each step.<sup><a href="#about-the-data">1</a></sup> Across the basin, S&P Global
Energy's outlook has egress capacity more than doubling by the early 2030s, by about 108% for oil and 114% for gas,
supporting a path toward about 2.7 million boe/d of national production, with unconventional output more than
doubling its 2025 level by 2030.<sup><a href="#about-the-data">1</a></sup>
On the gas side, the Argentina LNG project (discussed in the third pillar) would turn a domestic, seasonal market
into an export business.

{% include energy-chart.html
     kind="bars"
     id="iapgh-oil-evacuation"
     data="/data/processed/iapgh2026_oil_evacuation.json"
     title="Vaca Muerta oil production vs evacuation capacity"
     height="460px"
     source_name="TGS, as shown at IAPG Houston's Shale in Argentina 2026"
     source_url="#about-the-data"
     note="Re-plotted from the conference slide; values as printed on it." %}

The operator landscape behind these numbers is concentrated. YPF has drilled more than twice the cumulative meters
of the next operator since 2009, and since 2021 about 90% of the meters it drilled in its eight largest fields went
to its Vaca Muerta blocks: La Amarga Chica, Bandurria Sur and Loma Campana. S&P Global Energy's figures make the
same point at national scale: unconventional production rose from about 10% of Argentina's oil and gas output in
2015 to about 65% in 2025, growing about 9% a year since 2020, and YPF and the regional independents account for
about 85% of unconventional oil and 82% of unconventional gas.<sup><a href="#about-the-data">1</a></sup>

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

{% include takeaway.html title="Key takeaway" text="Vaca Muerta has the geology and, increasingly, the fiscal framework of a first-tier play. What it lacks is the midstream and the track record of rule stability that turn a resource into cash flow at scale." %}

## Pillar 1 — Near-term capital efficiency: well construction as a factory

The first lever is the cost and cycle time of each well. Vaca Muerta's operators have moved from drilling individual
wells to running a manufacturing system, and the data shows the results in output per rig rather than in rig count.

{% include stat-tiles.html group="drilling" %}

- **Lever: factory pad drilling and lean execution.** Multi-well pads, batch drilling and standardized well designs
  let rigs walk between wellheads instead of rigging down. YPF's "Toyota Well" program, which applies the Toyota
  production system to well construction, is reported to have cut well construction time by 25% and start-up time by
  71% ([Río Negro](https://www.rionegro.com.ar/energia/gracias-al-toyota-well-ypf-redujo-un-25-el-tiempo-de-construccion-de-pozos-en-vaca-muerta-4355225/)),
  supported by a 24/7 Real Time Intelligence Center that monitors and intervenes in drilling and fracturing remotely
  ([EconoJournal](https://econojournal.com.ar/oilgas/ypf-inauguro-el-real-time-intelligence-center-para-controlar-e-intervenir-la-perforacion-y-fractura-de-sus-pozos-en-vaca-muerta-de-forma-remota/)).
  YPF has reported drilling a 1,747 m horizontal section in under 24 hours
  ([EconoJournal](https://econojournal.com.ar/oilgas/mejora-en-la-competitividad-de-vaca-muerta-ypf-perforo-un-pozo-horizontal-de-1747-metros-en-menos-24-horas/)).
  In Houston, Marín described the center as staffed by more than 1,000 engineers across upstream and downstream,
  and service companies described real-time monitoring hubs covering up to about 130 rigs and AI-assisted drilling
  optimization.<sup><a href="#about-the-data">1</a></sup> Chevron is applying the same logic at El Trapial: a
  second rig in June 2027 will build an inventory of drilled wells so that a frac crew can work continuously instead
  of intermittently, the change its president of shale and tight called a game changer in the Permian. "The same
  will happen in Vaca Muerta. I'm 100% convinced of that," he told Reuters ([Reuters, 23 October 2026](https://chevron.co/li-argentina-shale)).
  - *Impact:* Argentina's active rig count averaged about 105 in 2015 and 41 in 2025 (Baker Hughes), yet the
    lateral length fractured per active rig rose roughly 5x between 2019 and 2025, from about 6 km to about 33 km a
    year. Fewer, higher-specification rigs now deliver the basin's growth.
  - *Impact:* The learning curve is steep. Chevron's president of shale and tight told the conference that the
    company's Argentine drilling efficiency improved within about 50 wells, against roughly 300 wells for a
    comparable gain in the Permian, and that running shale as one integrated portfolio across basins, with the
    same service contracts and shared know-how, cut capital per barrel by about 25%.<sup><a href="#about-the-data">1</a></sup>
- **Lever: managed pressure drilling (MPD) as a system, not a contingency.** Longer laterals raise equivalent
  circulating density and surge and swab pressures, narrowing an already tight pore-to-fracture window in the
  Quintuco and Vaca Muerta formations. MPD has become standard in the basin for this reason
  ([LM Neuquén](https://mase.lmneuquen.com/vaca-muerta/mpd-la-tecnologia-que-transformo-la-forma-perforar-la-cuenca-neuquina-n1217604)),
  and YPF's five-year, roughly US$600 million award to Archer centers on seven high-specification rigs with
  integrated MPD systems ([Drilling Contractor](https://drillingcontractor.org/archer-wins-five-year-ypf-drilling-award-in-vaca-muerta-76168)).
  As discussed in [Beyond the Bit: How Holistic Managed Pressure Drilling Is Redefining the Well Construction
  Playbook in Vaca Muerta]({% post_url 2025-08-10-holistic-mpd-vaca-muerta %}), extending MPD from influx management to the full well lifecycle can safely extend lateral reach by about 70%, cut
  tripping time in half and take cementing off the critical path. Integration with the rig matters as much as
  the technique: in a Nabors case study comparing two Vaca Muerta operators, MPD built into the rig, with a dual
  choke manifold and automated pump ramp-ups and ramp-downs, cut MPD-related flat time per well from 32.7 to 23.5
  hours between 2022 and late 2023 (28%) and stayed 6.5 hours below conventional MPD, while rotary ROP rose 36%,
  weight-to-weight connection times fell 40% and the automation suite saved about 10 days per well cycle
  ([Nabors](https://www.nabors.com/wp-content/uploads/2024/08/CASE-STUDY-Integra-MPD-Ready-Argentina-1211-2024-Final.pdf)).
  - *Impact:* MPD is what makes the step-change in lateral length below drillable at factory pace; without it,
    longer wells would buy reservoir contact at the expense of non-productive time. Deployed as part of the rig
    rather than as a third-party add-on, it also removes rig-up time and flat time from every pad move.

{% include energy-chart.html
     kind="bars"
     id="nabors-mpd-flat-time"
     data="/data/processed/nabors_mpd_flat_time.json"
     title="MPD-related flat time per well: conventional vs rig-integrated MPD"
     height="420px"
     source_name="Nabors, Integra MPD Ready & SmartDRILL case study (2024)"
     source_url="https://www.nabors.com/wp-content/uploads/2024/08/CASE-STUDY-Integra-MPD-Ready-Argentina-1211-2024-Final.pdf"
     note="Re-plotted from the case study; Operator 1 with non-Nabors MPD vs Operator 2 with Nabors MPD, rig 1211." %}

- **Lever: wells, not rigs, as the activity unit.** The official count of wells being drilled each month follows the
  rig count through the cycle (correlation of 0.7 since 2013) but has pulled away from it since 2021: with pad
  drilling, each rig works on more than one well a month.
  - *Impact:* Rig count alone now understates activity. Boards tracking the basin should read rigs, wells and frac
    stages together. The headroom is large: the activity comparison shown in Houston put Vaca Muerta's active rigs
    at about 16% of the Permian's and its annual frac stages at about 4% of US land, and service companies expected
    12 to 14 new rigs to arrive by late 2027 or early 2028, which would require about three more frac fleets.<sup><a href="#about-the-data">1</a></sup>

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

{% include takeaway.html title="Key takeaway" text="The basin grows on output per rig, not on rig count. Pad drilling, MPD integrated into the rig and continuous drill-then-frac sequencing turn a narrow drilling window into factory-pace laterals; operators that run them as one system move fastest down the learning curve." %}

## Pillar 2 — Medium-term structural margin: completion intensity at commodity cost

The second lever is the completion, which is the largest single cost of a shale well. Vaca Muerta operators have
increased completion intensity on every axis while working to turn the frac itself into a commodity service.

{% include stat-tiles.html group="completion" %}

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
  and wet-sand pilots have reduced the cost per tonne of processed proppant
  ([SLB, with Vista](https://www.slb.com/resource-library/case-study-with-navigation/rpst/wet-sand-fracturing-vista-energy-argentina-vaca-muerta-basin-cs)).
  Sand logistics remain the open item: Chevron still trucks its frac sand nearly 2,000 km from north of Buenos
  Aires because local sources have not yet performed under high-pressure fracturing, and bringing a well online
  costs about 30% more than in the Permian, a gap that better well productivity only partly closes ([Reuters, 23 October 2026](https://chevron.co/li-argentina-shale)).
  Switching fleets from diesel to local gas is estimated by one supplier at about US$30 million a year per fleet
  ([LM Neuquén](https://mase.lmneuquen.com/vaca-muerta-marcelo-guiscardo-ahorro-sets-fractura)).
  The service panel in Houston framed the next gains in the same terms: more value from each unit of capacity
  through simul-frac, lower non-productive time and more stages per day, with one provider citing about 1,200 frac
  stages a month and another about 30% of its fleet converted to dual fuel. The binding constraint they named was
  people: skilled crews, and engineers and data specialists able to turn real-time data into decisions.<sup><a href="#about-the-data">1</a></sup>
  - *Impact:* Frac stages pumped in Argentina rose from about 6,300 in 2019 to about 22,500 in 2025, a 3.6x increase,
    while the number of wells fractured rose only about 1.4x. Forecasts point to about 28,000 stages in 2026 and
    about 39,000 in 2027 ([El Economista](https://eleconomista.com.ar/energia/fucello-vaca-muerta-ya-demostro-recurso-ahora-debe-demostrar-escala-n98006)).

{% include energy-chart.html
     kind="bars"
     id="iapgh-frac-stages"
     data="/data/processed/iapgh2026_frac_stages.json"
     title="Vaca Muerta frac stages per year, with projections"
     height="440px"
     source_name="Fundación Contactos Energéticos (fracstages.com), as shown at IAPG Houston's Shale in Argentina 2026"
     source_url="#about-the-data"
     note="Re-plotted from the conference slide; values as printed on it. 2026: 16,968 stages to July plus the annualized estimate." %}

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

{% include takeaway.html title="Key takeaway" text="Completion intensity has largely converged with US practice; the remaining margin sits in the supply chain. Qualified local sand, gas-fired or electric fleets and continuous simul-frac utilization are the levers that can close the roughly 30% well-cost gap with the Permian." %}

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
- **Lever: active portfolio management.** Operators are high-grading toward shale. Marín contrasted conventional
  lifting costs of about US$20–90/bbl with about US$3–4/bbl in Vaca Muerta to explain YPF's exit from mature
  conventional blocks (and from Metrogas). Pluspetrol presented itself as a pure shale player after acquiring
  ExxonMobil's Vaca Muerta assets and divesting conventional fields, and GeoPark described its entry into the
  black-oil window, where it started drilling in March 2026 with a plan of 50 to 55 wells at 10 to 15 a year from a
  single high-specification rig, relying on VMOS to evacuate its oil.<sup><a href="#about-the-data">1</a></sup>
  The majors are scaling up with the same playbook. Chevron, which fully owns and operates El Trapial (about 40,000
  boe/d) and holds 50% of Loma Campana (about 110,000 boe/d) and Narambuena alongside YPF, has submitted a US$13.8
  billion, 30-year investment plan for El Trapial, plans to go from one to three rigs there by early 2029 and
  targets tripling its Argentine output to 195,000 boe/d by 2035, possibly a year or two sooner; it also holds a
  stake in VMOS ([Reuters, 23 October 2026](https://chevron.co/li-argentina-shale)).
  - *Impact:* Capital is concentrating where the cost per barrel is lowest; for newer entrants, access to
    evacuation capacity is as important as the acreage itself.

{% include stat-tiles.html group="chevron" %}

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

- **Lever: LNG as the upside option.** YPF's "4x4" strategy
  ([YPF Form 20-F, FY2025](https://www.sec.gov/Archives/edgar/data/904851/000119312526126363/d95578d20f.htm)) rests
  on four pillars, as presented in Houston: focus on the most profitable business (Vaca Muerta oil), active
  portfolio management, upstream and downstream efficiency, and the Argentina LNG project.<sup><a href="#about-the-data">1</a></sup> The
  project's first stage, with Eni and XRG, is designed around two 6 MTPA floating LNG units for 12 MTPA in total,
  with YPF retaining 36% and Eni and XRG holding 32% each
  ([Pipeline & Gas Journal](https://pgjonline.com/news/2026/february/ypf-eni-xrg-advance-12-mmtpy-argentina-lng-toward-fid)).
  With a reported cost of about US$51 billion, the project had 27 of its 28 required contracts agreed as of early
  November 2026 and a final investment decision targeted for late November, with first cargo expected around 2030
  ([The Rio Times](https://www.riotimesonline.com/argentina-ypf-argentina-lng-27-of-28-contracts-2026/),
  [Latin Times](https://www.latintimes.com/ypf-argentina-lng-project-offtake-contracts-600874)).
  YPF's Houston keynote set out the full program at about 18 MTPA, expandable to about 24 MTPA:<sup><a href="#about-the-data">1</a></sup>
  - *Southern Energy (SESA), about 6 MTPA, tolling:* two chartered FLNG vessels, Hilli (2.45 MTPA, start-up in the
    second half of 2027) and MKII (3.5 MTPA, second half of 2028), fed by the RIGI-approved San Matías pipeline
    (about US$1.3 billion, 27 MMm³/d, about 470 km from Tratayén, mid-2028;
    [NGI](https://naturalgasintel.com/news/ypf-eyes-year-end-pipeline-fid-as-vaca-muerta-natural-gas-expansion-advances/)), with YPF holding 25%. Marín's first cargo is bound
    for Germany in the third quarter of 2027.
  - *Argentina LNG, about 12 MTPA:* two owned 6 MTPA FLNG units, about US$24 billion of infrastructure capex, final
    investment decision in 2026 and start-up in 2030–31, supplied by five shale blocks with about 20 Tcf, about
    1,400 wells and peak gas production of about 60 MMm³/d, through a multi-product pipeline that also carries
    ethane, LPG and condensate.
  - *Expansion, about 6 MTPA:* one more FLNG unit for about US$8 billion, decision in 2027–28 and start-up around
    2032, needing about 10 Tcf, 30 MMm³/d and 600 more wells.

  The demand side was set out by S&P Global Energy: about 176 MTPA of new LNG supply capacity will be required by
  2050, with a new wave needed in the early 2030s, just as Argentine volumes would arrive and as US Lower 48 output
  matures. The midstream panel added that LNG buyers increasingly value flexibility, reliability and protection
  from geopolitical risk, and that NGLs can become a source of value and diversification rather than a
  by-product.<sup><a href="#about-the-data">1</a></sup>
  - *Impact:* LNG would decouple gas development from Argentina's seasonal domestic demand and give the dry- and
    wet-gas windows an export outlet. If the build-out proceeds, it would place Vaca Muerta among the world's
    significant LNG supply sources by the early 2030s. The milestones are still ahead, and execution risk on
    financing, offtake and construction remains material.

{% include stat-tiles.html group="lng" %}

{% include energy-chart.html
     kind="bars"
     id="iapgh-lng-capacity"
     data="/data/processed/iapgh2026_lng_capacity.json"
     title="Argentina's announced LNG export capacity"
     height="360px"
     source_name="McKinsey Energy Insights, as shown at IAPG Houston's Shale in Argentina 2026"
     source_url="#about-the-data"
     note="Re-plotted from the conference slide; values as printed on it." %}

{% include takeaway.html title="Key takeaway" text="With about 20 MTPA of announced LNG capacity and an oil export pipeline ramping to about 700,000 bbl/d by 2028, Vaca Muerta is positioned to become a significant oil and LNG exporter by the early 2030s. Execution on financing, offtake and construction, not the resource, is now the critical path." %}

## The path forward

S&P Global Energy summarized Vaca Muerta's progress as a sequence of de-risking milestones: the geology and the
repeatability of production at scale are proven, market access is being built, and the durability of the rules for
capital is now being tested, with the next 24 months critical.<sup><a href="#about-the-data">1</a></sup> The open question is who converts the
basin's economics into durable returns. Three diagnostic questions can help boards and management teams
prioritize:

1. **Is our well-construction system improving at the basin's rate?** Compare lateral meters and stages delivered
   per rig and per frac fleet against the leaders, and test whether MPD, pad design and real-time operations are
   deployed as one system or as separate projects, and whether the people and data skills behind them can scale
   with 12 to 14 additional rigs.
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
- **Conference insights.** <sup>1</sup> Figures and statements from IAPG Houston's 5th *Shale in Argentina:
  Unleashing Vaca Muerta to the World* conference (Houston, 3 September 2026) come from the presentations shown
  there (YPF's keynote, S&P Global Energy and the IAPG/IAPG Houston context slides, which cite the IAPG reports,
  Pickering Energy Partners, Fundación Contactos Energéticos, the Secretaría de Energía, USGS and JP Morgan) and
  from the author's session notes, which are paraphrased. Values read from charts are approximate, and the figures
  are as presented, not independently verified. Five charts re-plot data from reference material rather than
  open data, without reproducing the original slides: the size-of-the-prize comparison (IAPG reports and Pickering
  Energy Partners), oil production against evacuation capacity (TGS), frac stages with projections (Fundación
  Contactos Energéticos), announced LNG capacity (McKinsey Energy Insights) and MPD flat time (Nabors case study).
  Their values are in `script/reference_chart_data.py`, with each source and which values were read off a chart.
- **Headline figures.** The stat tiles repeat figures cited in the text, with the source under each tile; they are
  kept in `_data/vm_figures.yml`. Chevron's plans and the Permian comparisons come from Reuters' 23 October 2026
  report, distributed by Chevron. The resource estimate is from the IAPG Comisión de
  Exploración y Desarrollo de Hidrocarburos, *Estimación de los Recursos Remanentes Técnicamente Recuperables de
  Petróleo de la Fm. Vaca Muerta disponibles al 31 de diciembre de 2024* (July 2026), best estimate (Pmean).
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
