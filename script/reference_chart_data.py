# script/reference_chart_data.py
"""
Chart data re-plotted from reference material that is not open data:

  - slides shown at IAPG Houston's 5th "Shale in Argentina: Unleashing Vaca
    Muerta to the World" (Houston, 3 September 2026);
  - the Nabors "Integra MPD Ready & SmartDRILL" Vaca Muerta case study (2024).

The slides and documents themselves are not published; only the values below
are used, each with its source as cited on the slide or document. Values printed on a slide are copied
as shown; values marked "read" were read off the bars of a photographed chart
and are approximate (rounded to the precision noted).

Outputs (data/processed/, drawn by the 'bars' kind in assets/js/energyCharts.js):
  iapgh2026_size_of_prize.json     remaining recoverable oil and gas, VM vs US basins
  iapgh2026_oil_evacuation.json    VM oil production vs pipeline evacuation capacity
  iapgh2026_frac_stages.json       VM frac stages per year, history and projection
  iapgh2026_lng_capacity.json      Argentina LNG export capacity by announced project
  nabors_mpd_flat_time.json        MPD-related flat time per well, conventional vs integrated MPD

Usage:
  python script/reference_chart_data.py
"""
import os

from energy_charts_data import write

OUT = os.path.join("data", "processed")
EVENT = "IAPG Houston, Shale in Argentina 2026 (3 Sep 2026)"


def size_of_prize():
    # Slide "The Size of the Prize: Estimated Remaining Recoverable Volumes"
    # (IAPG / IAPG Houston). Vaca Muerta oil is printed in the IAPG study
    # (P90 / Pmean / P10, remaining technically recoverable, end-2024); the
    # other values are read off the bars (oil to 1 Bbbl, gas to 5 Tcf).
    basins = ["Vaca Muerta", "Eagle Ford", "Delaware", "Midland"]
    oil = {"Low": [18.1, 4, 29, 20], "Mid": [30.2, 9, 50, 36], "High": [45.1, 15, 86, 62]}
    gas = {"Low": [145, 30, 100, 55], "Mid": [255, 55, 175, 100], "High": [395, 95, 310, 180]}
    return {
        "highlight": "Vaca Muerta",
        "shades": True,
        "panels": [
            {"title": "Oil", "unit": "billion bbl", "categories": basins,
             "series": [{"name": k, "data": v} for k, v in oil.items()]},
            {"title": "Gas", "unit": "Tcf", "categories": basins,
             "series": [{"name": k, "data": v} for k, v in gas.items()]},
        ],
        "subtitle": "Remaining recoverable volumes (reserves + contingent + prospective), low / mid / high · Vaca Muerta in orange",
        "source": "IAPG reports (Vaca Muerta); Pickering Energy Partners (Permian, Eagle Ford), as shown at " + EVENT,
        "approximate": True,
    }


def oil_evacuation():
    # TGS slide "Vaca Muerta's expansion will require takeaway capacity
    # solutions": values printed on the chart (kbbl/d).
    years = ["2025", "2026", "2027", "2028", "2029", "2030"]
    return {
        "panels": [{
            "unit": "kbbl/d", "categories": years,
            "series": [
                {"name": "Oil pipeline evacuation capacity", "type": "bar", "role": "soft",
                 "data": [716, 925, 1146, 1326, 1326, 1546]},
                {"name": "Oil production (projected)", "type": "line", "role": "accent",
                 "data": [600, 684, 929, 1132, 1266, 1399]},
            ],
        }],
        "subtitle": "Projected Vaca Muerta oil production and pipeline evacuation capacity, kbbl/d",
        "source": "TGS, as shown at " + EVENT,
        "approximate": False,
    }


def frac_stages():
    # IAPG Houston slide "Frac Stages - Shale (Unconventional)", source
    # Fundación Contactos Energéticos (fracstages.com): values printed on the
    # chart. 2026 = 16,968 stages to July plus the annualized estimate (28,000).
    years = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026e", "2027e"]
    hist = [1700, 3000, 4800, 6400, 3300, 10300, 12500, 14700, 17800, 23900, 16968, None]
    proj = [None] * 10 + [28000 - 16968, 39000]
    return {
        "panels": [{
            "unit": "stages", "categories": years,
            "series": [
                {"name": "Historical / year to date", "type": "bar", "stack": "s", "role": "accent", "data": hist},
                {"name": "Estimate / projection", "type": "bar", "stack": "s", "role": "projection", "data": proj},
            ],
            "totals": [1700, 3000, 4800, 6400, 3300, 10300, 12500, 14700, 17800, 23900, 28000, 39000],
        }],
        "subtitle": "Vaca Muerta frac stages per year; 2026 = actual to July + annualized estimate",
        "source": "Fundación Contactos Energéticos (fracstages.com), as shown at " + EVENT,
        "approximate": False,
    }


def lng_capacity():
    # McKinsey & Company slide "Argentina's LNG export capacity could grow to
    # 20 mtpa with announced projects" (McKinsey Energy Insights): printed values.
    return {
        "horizontal": True,
        "panels": [{
            "unit": "MTPA",
            "categories": ["Hilli Episeyo (SESA)", "MK II (SESA)", "Argentina LNG", "LNG del Plata"],
            "series": [{"name": "Capacity", "type": "bar", "data": [
                {"value": 2.5, "role": "accent", "status": "FID achieved in 2025"},
                {"value": 3.5, "role": "accent", "status": "FID achieved in 2025"},
                {"value": 12.0, "role": "accent2", "status": "Expecting FID in 2026"},
                {"value": 2.4, "role": "soft", "status": "Pre-FID, date TBD"},
            ]}],
        }],
        "legend": [{"role": "accent", "label": "FID achieved (2025)"},
                   {"role": "accent2", "label": "Expecting FID (2026)"},
                   {"role": "soft", "label": "Pre-FID"}],
        "subtitle": "Announced floating LNG projects, MTPA · total Argentina 20.4 MTPA",
        "source": "McKinsey Energy Insights, as shown at " + EVENT,
        "approximate": False,
    }


def mpd_flat_time():
    # Nabors case study "Nabors Integra MPD Ready & SmartDRILL Significantly
    # Reduced Days on Well in Vaca Muerta" (rig 1211; Operator 1 with
    # non-Nabors MPD vs Operator 2 with Nabors MPD): values printed on the chart.
    return {
        "panels": [{
            "unit": "hours per well", "categories": ["Q2 2022", "Q3 2023", "Q4 2023"],
            "series": [
                {"name": "Conventional MPD", "type": "bar", "role": "soft", "data": [38.3, 32.8, 30.0]},
                {"name": "Rig-integrated MPD (Nabors Integra)", "type": "bar", "role": "accent", "data": [32.7, 28.2, 23.5]},
            ],
        }],
        "subtitle": "MPD-related flat time per well, hours · 8.5-in. section, Vaca Muerta",
        "source": "Nabors case study, Integra MPD Ready & SmartDRILL (2024)",
        "approximate": False,
    }


def main():
    for name, fn in [("size_of_prize", size_of_prize), ("oil_evacuation", oil_evacuation),
                     ("frac_stages", frac_stages), ("lng_capacity", lng_capacity)]:
        write(fn(), os.path.join(OUT, f"iapgh2026_{name}.json"))
    write(mpd_flat_time(), os.path.join(OUT, "nabors_mpd_flat_time.json"))


if __name__ == "__main__":
    main()
