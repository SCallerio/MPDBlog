# script/process_rig_count.py
"""
Baker Hughes rig count for Argentina, as monthly activity candles.

Source: Baker Hughes Worldwide Rig Count workbook (rigcount.bakerhughes.com),
sheet "WW Monthly", filtered to Region = Latin America and Country = Argentina
(land and offshore rigs summed per month).

Output: data/processed/rig_count_velas.json  {"indicators": [...]}, the same
shape as pozos_velas.json, appended to the activity candles.

The workbook layout has changed over the years, so the parser looks for the
header row and the date/value columns by name, and prints only the layout it
found (sheet names, columns, row counts). If anything fails, the previous
output is kept and the script exits without error: the candles still work
with the other indicators.

Usage:
  python script/process_rig_count.py [--xlsx worldwide.xlsx]
"""
import argparse
import os
import re
import sys

import pandas as pd
import requests

from energy_charts_data import monthly_candles, write

PAGE_URL = "https://rigcount.bakerhughes.com/intl-rig-count"
FALLBACK_URL = "https://rigcount.bakerhughes.com/static-files/ee2f783a-97f4-4ca1-be03-e685d301fc28"
OUTPUT_PATH = os.path.join("data", "processed", "rig_count_velas.json")
UA = {"User-Agent": "Mozilla/5.0 (compatible; MPDBlog data refresh)"}
MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def download(path):
    """The workbook link changes with each release: look for it on the
    international rig count page, else use the known link."""
    url = FALLBACK_URL
    try:
        html = requests.get(PAGE_URL, headers=UA, timeout=60).text
        links = re.findall(r'href="([^"]*static-files/[0-9a-f-]{36})"[^>]*>([^<]*)<', html)
        ww = [h for h, text in links if re.search(r"worldwide", text, re.I)]
        if ww:
            url = ww[0] if ww[0].startswith("http") else "https://rigcount.bakerhughes.com" + ww[0]
        print(f"Workbook links on the page: {len(links)}; worldwide: {len(ww)}")
    except Exception as e:
        print(f"Rig count page unavailable ({e}); using the known link")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    r = requests.get(url, headers=UA, timeout=180)
    r.raise_for_status()
    with open(path, "wb") as f:
        f.write(r.content)
    print(f"Downloaded {url}: {len(r.content):,} bytes")
    return path


def _norm(v):
    return re.sub(r"[^a-z0-9]+", " ", str(v).lower()).strip()


def _month(v):
    if isinstance(v, (int, float)) and not pd.isna(v) and 1 <= int(v) <= 12:
        return int(v)
    return MONTHS.get(_norm(v)[:3])


def argentina_monthly(xlsx):
    sheets = pd.ExcelFile(xlsx).sheet_names
    print(f"Sheets: {sheets}")
    sheet = next((s for s in sheets if _norm(s) == "ww monthly"),
                 next((s for s in sheets if re.search(r"ww.*month", s, re.I)), None))
    if sheet is None:
        raise ValueError("no 'WW Monthly' sheet")
    raw = pd.read_excel(xlsx, sheet_name=sheet, header=None)
    hdr = next(i for i in range(min(40, len(raw)))
               if {"country", "region"} <= {_norm(v) for v in raw.iloc[i].tolist()})
    df = raw.iloc[hdr + 1:].copy()
    df.columns = [_norm(v) if not pd.isna(v) else f"col{k}" for k, v in enumerate(raw.iloc[hdr])]
    print(f"Sheet '{sheet}': header at row {hdr}, columns {list(df.columns)}, {len(df):,} rows")

    region = next(c for c in df.columns if c == "region")
    country = next(c for c in df.columns if c == "country")
    regions = df[region].dropna().astype(str).str.strip().unique().tolist()
    print(f"Regions: {regions}")
    df = df[df[region].astype(str).str.contains("latin", case=False)
            & df[country].astype(str).str.strip().str.lower().eq("argentina")]
    print(f"Argentina rows: {len(df):,}")
    if df.empty:
        raise ValueError("no Argentina rows")

    cols = list(df.columns)
    date_col = next((c for c in cols if c in ("date", "publish date", "month year")), None)
    year_col = next((c for c in cols if c == "year"), None)
    month_col = next((c for c in cols if c == "month"), None)
    value_col = next((c for c in cols if re.fullmatch(r"(rig ?count|rigs|count|value|total)( value)?", c)), None)

    if value_col and (date_col or (year_col and month_col)):
        # Long layout: one row per month (and per location: land / offshore).
        if date_col:
            when = pd.to_datetime(df[date_col], errors="coerce")
        else:
            when = pd.to_datetime(dict(year=pd.to_numeric(df[year_col], errors="coerce"),
                                       month=df[month_col].map(_month), day=1), errors="coerce")
        vals = pd.to_numeric(df[value_col], errors="coerce")
        print(f"Long layout: date from {date_col or (year_col, month_col)}, value from '{value_col}'")
    else:
        # Wide layout: one column per month (headers parse as dates or 'Jan 2024'),
        # or a Year column plus one column per month name.
        month_cols = {c: _month(c) for c in cols if _month(c)}
        if year_col and len(month_cols) >= 12:
            long = df.melt(id_vars=[year_col], value_vars=list(month_cols), var_name="m", value_name="v")
            when = pd.to_datetime(dict(year=pd.to_numeric(long[year_col], errors="coerce"),
                                       month=long["m"].map(month_cols), day=1), errors="coerce")
            vals = pd.to_numeric(long["v"], errors="coerce")
            print(f"Wide layout: year column '{year_col}' and {len(month_cols)} month columns")
        else:
            dated = {c: pd.to_datetime(c, errors="coerce") for c in cols}
            dated = {c: d for c, d in dated.items() if not pd.isna(d)}
            if not dated:
                raise ValueError("could not find the date and value columns")
            long = df.melt(value_vars=list(dated), var_name="c", value_name="v")
            when = long["c"].map(dated)
            vals = pd.to_numeric(long["v"], errors="coerce")
            print(f"Wide layout: {len(dated)} date columns")

    s = pd.DataFrame({"when": when.values, "v": vals.values}).dropna()
    monthly = s.groupby(s["when"].dt.to_period("M").dt.to_timestamp())["v"].sum()
    print(f"Argentina monthly rig count: {monthly.index.min():%Y-%m}..{monthly.index.max():%Y-%m}, "
          f"{len(monthly)} months")
    return monthly


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--xlsx", help="local workbook (downloaded if omitted)")
    parser.add_argument("--out", default=OUTPUT_PATH)
    args = parser.parse_args()
    try:
        xlsx = args.xlsx or download(os.path.join("data", "raw", "bh-worldwide-rig-count.xlsx"))
        monthly = argentina_monthly(xlsx)
        df = pd.DataFrame({"indice_tiempo": monthly.index, "cantidad": monthly.values})
        ind = monthly_candles(df, "rig_count", "Active rigs (Baker Hughes)", "rigs",
                              source="Baker Hughes Worldwide Rig Count")
        write({"indicators": [ind]}, args.out)
    except Exception as e:
        print(f"Rig count not updated: {type(e).__name__}: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
