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


_ES_SMALL = {"de", "del", "la", "las", "los", "el", "y", "e", "en"}


def title_es(name):
    """'CRUZ DE LORENA' -> 'Cruz de Lorena' (Spanish particles stay lowercase)."""
    words = str(name).strip().lower().split()
    return " ".join(w if (i and w in _ES_SMALL and words[i - 1] != "-") else w[:1].upper() + w[1:]
                    for i, w in enumerate(words))


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
                            max_label_len=22, window=4, min_wells=3):
    """Per company, a trailing `window`-quarter average over its horizontal
    wells (lateral > 0), by the quarter the frac job ended, shown each quarter.
    Points resting on fewer than `min_wells` wells are null (a gap in the line).
    Returns three long tables for the line race ([["trimestre", "empresa", v], ...]):
      lateral   average lateral length per well (m)
      stages    average frac stages per well
      density   frac stages per 1,000 m of lateral (total stages / total lateral)"""
    wells = _frac_wells(df, time_col, company_col, start)
    wells = wells[wells["lateral"] > 0].copy()
    wells["q"] = wells["date"].dt.to_period("Q")
    last = wells["date"].max()
    end_q = last.to_period("Q")
    # Drop the last quarter when it is incomplete: a few days of wells read as a jump.
    if last < end_q.end_time.normalize():
        end_q -= 1
    quarters = pd.period_range(wells["q"].min(), end_q, freq="Q")
    top = wells.groupby(company_col)["stages"].sum().nlargest(top_n).index
    labels = {c: short_name(c, max_label_len) for c in top}
    rows = {k: [["trimestre", "empresa", k]] for k in ("lateral", "stages", "density")}
    gaps = 0
    for q in quarters:
        for c in top:
            w = wells[(wells[company_col] == c) & (wells["q"] > q - window) & (wells["q"] <= q)]
            ok = len(w) >= min_wells
            gaps += not ok
            lat, st = w["lateral"].sum(), w["stages"].sum()
            vals = {"lateral": round(float(lat / len(w)), 0) if ok else None,
                    "stages": round(float(st / len(w)), 1) if ok else None,
                    "density": round(float(1000 * st / lat), 2) if ok else None}
            for k, v in vals.items():
                rows[k].append([f"{q.year} Q{q.quarter}", labels[c], v])
    print(f"Trailing {window}-quarter averages: {len(quarters)} quarters x {len(top)} companies, "
          f"{gaps} points with fewer than {min_wells} wells left empty")
    return rows


# --- Frac data by area (radar, calendar, change treemap, sankey) -------------

def _frac_area_wells(df, time_col, company_col, start, area_col="areapermisoconcesion"):
    """One row per fractured well with its area, frac start/end dates, lateral
    and stages."""
    d = df[df[time_col] >= pd.Timestamp(start)].copy()
    d["lateral"] = pd.to_numeric(d["longitud_rama_horizontal_m"], errors="coerce").fillna(0)
    d["stages"] = pd.to_numeric(d["cantidad_fracturas"], errors="coerce").fillna(0)
    d["area"] = d[area_col].astype(str).str.strip().str.upper().replace({"NAN": "UNKNOWN"})
    d["fstart"] = pd.to_datetime(d.get("fecha_inicio_fractura"), errors="coerce", format="mixed")
    return (d.groupby([company_col, "idpozo"])
             .agg(area=("area", "first"), start=("fstart", "min"), date=(time_col, "max"),
                  lateral=("lateral", "max"), stages=("stages", "sum"))
             .reset_index())


def _last_full_year(dates):
    last = dates.max()
    return last.year if (last.month == 12 and last.day == 31) else last.year - 1


def frac_radar(df, time_col, company_col, start="2015-01", top_areas=8):
    """Horizontal wells fractured per area and year, for the main areas."""
    w = _frac_area_wells(df, time_col, company_col, start)
    w = w[w["lateral"] > 0]
    w["year"] = w["date"].dt.year
    areas = w["area"].value_counts().head(top_areas).index.tolist()
    t = w[w["area"].isin(areas)].groupby(["year", "area"]).size().unstack(fill_value=0)
    t = t.reindex(columns=areas, fill_value=0)
    years = [str(y) for y in t.index]
    return {
        "areas": [title_es(a) for a in areas],
        "max": [int(t[a].max()) for a in areas],
        "years": years,
        "partial_year": _partial(w["date"].max()),
        "values": {str(y): [int(v) for v in row] for y, row in t.iterrows()},
    }


def frac_calendar(df, time_col, company_col, start="2015-01", years=3, max_job_days=60):
    """Frac stages per day for the last `years` calendar years. Each well's
    stages are spread evenly over its frac job (start to end date); jobs with a
    missing or implausible start date count on their end date."""
    w = _frac_area_wells(df, time_col, company_col, start)
    first_year = w["date"].max().year - years + 1
    w = w[w["date"].dt.year >= first_year - 1]
    daily = {}
    for r in w.itertuples():
        s, e = r.start, r.date
        if pd.isna(s) or s > e or (e - s).days > max_job_days:
            s = e
        days = pd.date_range(s.normalize(), e.normalize(), freq="D")
        share = r.stages / len(days)
        for d in days:
            daily[d] = daily.get(d, 0) + share
    s = pd.Series(daily).sort_index()
    s = s[s.index.year >= first_year]
    yrs = sorted({d.year for d in s.index})
    return {
        "unit": "stages",
        "years": [str(y) for y in yrs],
        "last_date": f"{w['date'].max():%Y-%m-%d}",
        "max": round(float(s.quantile(0.98)), 1),
        "days": [[f"{d:%Y-%m-%d}", round(float(v), 1)] for d, v in s.items() if v > 0],
    }


def frac_change_tree(df, time_col, company_col, start="2015-01", top_companies=8, top_areas=6):
    """Company -> area treemap of the last full year, for frac stages and
    lateral length, each node carrying [value, previous year, % change]."""
    w = _frac_area_wells(df, time_col, company_col, start)
    w["year"] = w["date"].dt.year
    year = _last_full_year(w["date"])
    w = w[w["year"].isin([year - 1, year])]
    top = w[w["year"] == year].groupby(company_col)["stages"].sum().nlargest(top_companies).index
    w["company"] = w[company_col].where(w[company_col].isin(top), "Other companies")

    def node(name, cur, prev, children=None):
        pct = None if prev == 0 else round(100.0 * (cur - prev) / prev, 1)
        n = {"name": name, "value": [round(float(cur), 1), round(float(prev), 1), pct]}
        if children:
            n["children"] = children
        return n

    metrics = {}
    for key, col, unit in [("stages", "stages", "stages"), ("lateral", "lateral", "m")]:
        piv = w.pivot_table(index=["company", "area"], columns="year", values=col, aggfunc="sum", fill_value=0)
        piv = piv.reindex(columns=[year - 1, year], fill_value=0)
        tree = []
        for comp, g in piv.groupby(level=0):
            g = g.droplevel(0).sort_values(year, ascending=False)
            g = g[g[year] > 0]
            if g.empty:
                continue
            kids = [node(title_es(a), r[year], r[year - 1]) for a, r in g.head(top_areas).iterrows()]
            rest = g.iloc[top_areas:]
            if len(rest):
                kids.append(node("Other areas", rest[year].sum(), rest[year - 1].sum()))
            all_prev = piv.loc[comp][year - 1].sum()
            tree.append(node(short_name(comp, 22), g[year].sum(), all_prev, kids))
        tree.sort(key=lambda n: (n["name"] == "Other companies", -n["value"][0]))
        metrics[key] = {"unit": unit, "tree": tree}
    return {"year": str(year), "prev": str(year - 1), "metrics": metrics}


def frac_sankey(df, time_col, company_col, start="2015-01", top_companies=8, top_areas=12):
    """Total frac stages since `start`: company -> area flows."""
    w = _frac_area_wells(df, time_col, company_col, start)
    top_c = w.groupby(company_col)["stages"].sum().nlargest(top_companies).index
    top_a = w.groupby("area")["stages"].sum().nlargest(top_areas).index
    w["company"] = w[company_col].where(w[company_col].isin(top_c), "Other companies").map(
        lambda c: c if c == "Other companies" else short_name(c, 22))
    w["area_lbl"] = w["area"].where(w["area"].isin(top_a), "OTHER AREAS").map(title_es)
    w.loc[w["area_lbl"] == "Other Areas", "area_lbl"] = "Other areas"
    flows = w.groupby(["company", "area_lbl"])["stages"].sum()
    flows = flows[flows > 0]
    companies = w.groupby("company")["stages"].sum().sort_values(ascending=False).index.tolist()
    areas = w.groupby("area_lbl")["stages"].sum().sort_values(ascending=False).index.tolist()
    return {
        "unit": "stages",
        "period": f"{pd.Timestamp(start).year}–{w['date'].max().year}",
        "nodes": [{"name": c, "kind": "company"} for c in companies] +
                 [{"name": a, "kind": "area"} for a in areas],
        "links": [{"source": c, "target": a, "value": round(float(v))} for (c, a), v in flows.items()],
    }
