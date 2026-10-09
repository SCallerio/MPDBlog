# script/energy_charts_data.py
"""
Data builders for the ECharts charts in assets/js/energyCharts.js (bar race
data comes from line_race_data.build_cumsum):

  province_year_map()  meters drilled per province and year   -> choropleth map
  drilldown_tree()     basin -> province -> company, per year  -> treemap
  frac_bubbles()       per company and year: avg lateral, avg stages, wells
                                                               -> bubble chart
  frac_candles()       monthly candles of frac activity        -> candlestick
  monthly_candles()    monthly candles of a monthly series     -> candlestick
"""
import json
import os

import pandas as pd

from argentina_geo import canonical_province
from line_race_data import short_name


def write(obj, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Saved {path} ({os.path.getsize(path) / 1024:.0f} KB)")


def _partial(last):
    """'2026 (Jan-Aug)' style note when the last year is not complete."""
    if last.month == 12:
        return None
    return f"{last.year} (Jan–{last:%b})"


# --- Meters drilled (metros-perforados.csv) ---------------------------------

def _prep_metros(df):
    df = df.copy()
    df["indice_tiempo"] = pd.to_datetime(df["indice_tiempo"], errors="coerce")
    df["cantidad"] = pd.to_numeric(df["cantidad"], errors="coerce").fillna(0)
    df = df.dropna(subset=["indice_tiempo"])
    df["year"] = df["indice_tiempo"].dt.year
    df["provincia"] = df["provincia"].astype(str).str.strip().map(canonical_province)
    return df


def province_year_map(df):
    """Meters drilled per province and calendar year. 'Estado Nacional' (the
    offshore federal jurisdiction) has no polygon on the map and is reported
    separately."""
    df = _prep_metros(df)
    by = df.groupby(["year", "provincia"])["cantidad"].sum().round(0)
    years = sorted(df["year"].unique().tolist())
    values, offshore = {}, {}
    for y in years:
        s = by.loc[y]
        offshore[str(y)] = float(s.get("Estado Nacional", 0))
        values[str(y)] = [{"name": p, "value": float(v)} for p, v in s.items()
                          if p != "Estado Nacional" and v > 0]
    return {
        "unit": "m",
        "years": [str(y) for y in years],
        "partial_year": _partial(df["indice_tiempo"].max()),
        "values": values,
        "offshore": offshore,
    }


def drilldown_tree(df, company_aliases=None, company_labels=None, top_basins=5,
                   top_companies=6):
    """Basin -> province -> company tree of meters drilled, one tree per year
    plus 'All years'. Small basins are grouped as 'Other basins' and, within a
    province, companies past the top N as 'Other companies'."""
    df = _prep_metros(df)
    df["idempresa"] = df["idempresa"].astype(str).str.strip()
    names = (df.groupby("idempresa")["empresa"]
               .agg(lambda s: s.astype(str).str.strip().mode().iat[0]))
    if company_aliases:
        df["idempresa"] = df["idempresa"].replace(company_aliases)
    labels = {c: short_name(n, 28) for c, n in names.items()}
    labels.update(company_labels or {})
    df["company"] = df["idempresa"].map(lambda c: labels.get(c, c))

    df["cuenca"] = df["cuenca"].astype(str).str.strip().str.title()
    big = df.groupby("cuenca")["cantidad"].sum().nlargest(top_basins).index
    df.loc[~df["cuenca"].isin(big), "cuenca"] = "Other basins"
    df["provincia"] = df["provincia"].replace({"Estado Nacional": "Offshore (Estado Nacional)"})

    def tree(part):
        nodes = []
        for basin, b in part.groupby("cuenca"):
            provs = []
            for prov, p in b.groupby("provincia"):
                comp = p.groupby("company")["cantidad"].sum().sort_values(ascending=False)
                comp = comp[comp > 0]
                if comp.empty:
                    continue
                kids = [{"name": c, "value": round(float(v))} for c, v in comp.head(top_companies).items()]
                rest = comp.iloc[top_companies:].sum()
                if rest > 0:
                    kids.append({"name": "Other companies", "value": round(float(rest))})
                provs.append({"name": prov, "value": round(float(comp.sum())), "children": kids})
            if provs:
                provs.sort(key=lambda n: -n["value"])
                nodes.append({"name": basin, "value": sum(n["value"] for n in provs), "children": provs})
        return sorted(nodes, key=lambda n: (n["name"] == "Other basins", -n["value"]))

    years = sorted(df["year"].unique().tolist())
    first, last = df["indice_tiempo"].min(), df["indice_tiempo"].max()
    all_label = f"All years ({first.year}–{last.year})"
    trees = {str(y): tree(df[df["year"] == y]) for y in years}
    trees[all_label] = tree(df)
    return {
        "unit": "m",
        "periods": [all_label] + [str(y) for y in years],
        "partial_year": _partial(last),
        "basins": [n["name"] for n in trees[all_label]],
        "trees": trees,
    }


# --- Frac data (Adjunto IV) --------------------------------------------------

def _frac_wells(df, time_col, company_col, start):
    """One row per fractured well: last frac end date, max lateral, total stages."""
    d = df[df[time_col] >= pd.Timestamp(start)].copy()
    d["lateral"] = pd.to_numeric(d["longitud_rama_horizontal_m"], errors="coerce").fillna(0)
    d["stages"] = pd.to_numeric(d["cantidad_fracturas"], errors="coerce").fillna(0)
    well_key = "idpozo" if "idpozo" in d.columns else None
    if well_key is None:
        d["_row"] = range(len(d))
        well_key = "_row"
    return (d.groupby([company_col, well_key])
             .agg(date=(time_col, "max"), lateral=("lateral", "max"), stages=("stages", "sum"))
             .reset_index())


def frac_bubbles(df, time_col, company_col, start="2015-01", top_n=8):
    """Per company and year, horizontal wells only (lateral > 0): average
    lateral length, average stages per well, and number of wells."""
    wells = _frac_wells(df, time_col, company_col, start)
    wells = wells[wells["lateral"] > 0]
    wells["year"] = wells["date"].dt.year
    top = wells.groupby(company_col)["stages"].sum().nlargest(top_n).index
    years = sorted(wells["year"].unique().tolist())
    series = []
    for comp in top:
        w = wells[wells[company_col] == comp]
        g = w.groupby("year").agg(lateral=("lateral", "mean"), stages=("stages", "mean"),
                                  wells=("lateral", "size"))
        points = {str(y): [round(float(r.lateral), 0), round(float(r.stages), 1), int(r.wells)]
                  for y, r in g.iterrows()}
        series.append({"company": short_name(comp, 22), "points": points})
    print("Bubble companies:", [s["company"] for s in series])
    return {
        "years": [str(y) for y in years],
        "partial_year": _partial(wells["date"].max()),
        "fields": ["avg_lateral_m", "avg_stages_per_well", "wells"],
        "series": series,
    }


def _candles_from_monthly(monthly, weekly=None):
    """Candle per month: open = previous month, close = this month. With weekly
    data, the wicks span the lowest and highest weekly pace in the month
    (weekly total scaled to the month's length); otherwise no wicks."""
    months, ohlc, change = [], [], []
    prev = None
    for m, v in monthly.items():
        if prev is None:
            prev = v
            continue
        lo, hi = min(prev, v), max(prev, v)
        if weekly is not None:
            wk = weekly[(weekly.index >= m) & (weekly.index < m + pd.offsets.MonthBegin(1))]
            if len(wk):
                scale = m.days_in_month / 7
                lo, hi = min(lo, wk.min() * scale), max(hi, wk.max() * scale)
        months.append(f"{m:%Y-%m}")
        ohlc.append([round(float(prev), 1), round(float(v), 1), round(float(lo), 1), round(float(hi), 1)])
        change.append(round(float(v - prev), 1))
        prev = v
    ma = monthly.rolling(12, min_periods=12).mean().iloc[1:]
    return months, ohlc, change, [None if pd.isna(x) else round(float(x), 1) for x in ma]


def frac_candles(df, time_col, start="2015-01"):
    """Monthly candles of frac stages, lateral length and wells fractured."""
    d = df[df[time_col] >= pd.Timestamp(start)].copy()
    d["stages"] = pd.to_numeric(d["cantidad_fracturas"], errors="coerce").fillna(0)
    d["lateral"] = pd.to_numeric(d["longitud_rama_horizontal_m"], errors="coerce").fillna(0)
    d["wells"] = 1
    last = d[time_col].max()
    # Drop the last, incomplete month so it doesn't read as a collapse.
    end = last.to_period("M").to_timestamp() if last.day < last.days_in_month else None
    indicators = []
    for key, col, name, unit in [("frac_stages", "stages", "Frac stages per month", "stages"),
                                 ("wells_fracked", "wells", "Wells fractured per month", "wells"),
                                 ("lateral_m", "lateral", "Lateral length fractured per month", "m")]:
        s = d.set_index(time_col)[col]
        monthly = s.resample("MS").sum()
        weekly = s.resample("W-MON", label="left", closed="left").sum()
        if end is not None:
            monthly = monthly[monthly.index < end]
            weekly = weekly[weekly.index < end]
        months, ohlc, change, ma = _candles_from_monthly(monthly, weekly)
        indicators.append({"key": key, "name": name, "unit": unit, "wicks": "weekly pace",
                           "source": "Datos de fractura de pozos (Adjunto IV)",
                           "months": months, "ohlc": ohlc, "change": change, "ma12": ma})
    return {"indicators": indicators}


def monthly_candles(df, key, name, unit, source, start="2009-01"):
    """Monthly candles of a datos.energia.gob.ar monthly count (indice_tiempo,
    cantidad), summed over every other column."""
    d = df.copy()
    d["indice_tiempo"] = pd.to_datetime(d["indice_tiempo"], errors="coerce")
    d["cantidad"] = pd.to_numeric(d["cantidad"], errors="coerce").fillna(0)
    d = d.dropna(subset=["indice_tiempo"])
    d = d[d["indice_tiempo"] >= pd.Timestamp(start)]
    monthly = d.groupby(d["indice_tiempo"].dt.to_period("M").dt.to_timestamp())["cantidad"].sum()
    monthly = monthly.reindex(pd.date_range(monthly.index.min(), monthly.index.max(), freq="MS"), fill_value=0)
    months, ohlc, change, ma = _candles_from_monthly(monthly)
    print(f"{name}: {months[0]}..{months[-1]}, last value {ohlc[-1][1]}")
    return {"key": key, "name": name, "unit": unit, "wicks": None, "source": source,
            "months": months, "ohlc": ohlc, "change": change, "ma12": ma}


def frac_quarterly_averages(df, time_col, company_col, start="2015-01", top_n=8,
                            max_label_len=22):
    """Quarterly averages per company over its horizontal wells (lateral > 0),
    by the quarter the frac job ended. Returns three long tables for the line
    race ([["trimestre", "empresa", value], ...]):
      lateral   average lateral length per well (m)
      stages    average frac stages per well
      density   frac stages per 1,000 m of lateral (total stages / total lateral)
    Quarters in which a company fractured no horizontal well are null."""
    wells = _frac_wells(df, time_col, company_col, start)
    wells = wells[wells["lateral"] > 0].copy()
    wells["q"] = wells["date"].dt.to_period("Q")
    top = wells.groupby(company_col)["stages"].sum().nlargest(top_n).index
    w = wells[wells[company_col].isin(top)]
    g = w.groupby(["q", company_col]).agg(lateral=("lateral", "mean"), stages=("stages", "mean"),
                                          lat_sum=("lateral", "sum"), st_sum=("stages", "sum"),
                                          n=("lateral", "size"))
    g["density"] = 1000 * g["st_sum"] / g["lat_sum"]
    quarters = pd.period_range(wells["q"].min(), wells["q"].max(), freq="Q")
    labels = {c: short_name(c, max_label_len) for c in top}
    out = {}
    for key, col, digits in [("lateral", "lateral", 0), ("stages", "stages", 1), ("density", "density", 2)]:
        rows = [["trimestre", "empresa", key]]
        for q in quarters:
            for c in top:
                v = g[col].get((q, c))
                rows.append([f"{q.year} Q{q.quarter}", labels[c], None if v is None or pd.isna(v) else round(float(v), digits)])
        out[key] = rows
    gaps = int(sum(r[2] is None for r in out["lateral"][1:]))
    print(f"Quarterly averages: {len(quarters)} quarters x {len(top)} companies, {gaps} empty company-quarters; "
          f"median wells per company-quarter {int(g['n'].median())}")
    return out
