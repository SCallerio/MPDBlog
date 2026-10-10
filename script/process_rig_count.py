# script/process_rig_count.py
"""
Baker Hughes rig counts as monthly activity candles:

  rig_count        Argentina, active rigs (land + offshore, all targets), from 2013
  rig_count_latam  Latin America, active rigs, from 2007

Sources, combined (for each month the newest workbook that has it wins):
  - the current Worldwide Rig Count workbook from rigcount.bakerhughes.com,
    when it can be downloaded (the site rejects GitHub-hosted runners);
  - the copies in data/reference/baker-hughes/:
      September-2026_WorldWide_Rig_Count_Report.xlsx   sheet "WW Monthly", by country, 2024-01..2026-09
      July-2025_WorldWide_Rig_Count_Report.xlsx        sheet "WW Monthly", by country, 2013-01..2025-07
      Worldwide_Rig_Count_Jan_2007_Mar_2024.xlsx       regional totals only (Latin America), 2007-01..2024-03
    To extend the series, drop a newer report in that folder.

"WW Monthly" is a long table (Region, Country, DrillFor, Location, [Rig
Status], Year, Month, Rig Count Value) under a summary block; the header row
and columns are found by name. Only "Active Rigs" rows count when a Rig Status
column is present. The script prints only the layout it finds; if nothing can
be read, the previous output is kept.

Output: data/processed/rig_count_velas.json  {"indicators": [...]}, the same
shape as pozos_velas.json.

Usage:
  python script/process_rig_count.py [--xlsx extra.xlsx ...] [--no-download]
"""
import argparse
import glob
import os
import re
import sys

import pandas as pd
import requests

from energy_charts_data import monthly_candles, write

PAGE_URL = "https://rigcount.bakerhughes.com/intl-rig-count"
FALLBACK_URL = "https://rigcount.bakerhughes.com/static-files/ee2f783a-97f4-4ca1-be03-e685d301fc28"
REFERENCE_DIR = os.path.join("data", "reference", "baker-hughes")
DOWNLOAD_PATH = os.path.join("data", "raw", "bh-worldwide-rig-count.xlsx")
OUTPUT_PATH = os.path.join("data", "processed", "rig_count_velas.json")
SOURCE = "Baker Hughes Worldwide Rig Count"
# A plain browser request; the site rejects obvious scripts.
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": PAGE_URL}
MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def download(path):
    """The workbook link changes with each release: look for it on the
    international rig count page, else use the known link."""
    url = FALLBACK_URL
    session = requests.Session()
    try:
        session.get("https://rigcount.bakerhughes.com/", headers=UA, timeout=60)
        page = session.get(PAGE_URL, headers=UA, timeout=60)
        print(f"Rig count page: HTTP {page.status_code}, {len(page.text):,} chars")
        links = re.findall(r'href="([^"]*static-files/[0-9a-f-]{36})"[^>]*>([^<]*)<', page.text)
        ww = [h for h, text in links if re.search(r"worldwide", text, re.I)]
        if ww:
            url = ww[0] if ww[0].startswith("http") else "https://rigcount.bakerhughes.com" + ww[0]
        print(f"Workbook links on the page: {len(links)}; worldwide: {len(ww)}")
    except Exception as e:
        print(f"Rig count page unavailable ({e}); using the known link")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    r = session.get(url, headers=UA, timeout=180)
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


def read_monthly_report(xlsx):
    """'WW Monthly' sheet -> (Argentina, Latin America) monthly series, or
    None when the workbook has no such sheet."""
    sheets = pd.ExcelFile(xlsx).sheet_names
    sheet = next((s for s in sheets if _norm(s) == "ww monthly"),
                 next((s for s in sheets if re.search(r"ww.*month", s, re.I)), None))
    if sheet is None:
        return None
    raw = pd.read_excel(xlsx, sheet_name=sheet, header=None)
    hdr = next(i for i in range(min(40, len(raw)))
               if {"country", "region"} <= {_norm(v) for v in raw.iloc[i].tolist()})
    names = [_norm(v) for v in raw.iloc[hdr]]
    # The long table is the leftmost block; a summary table sits to its right.
    end = next((k for k, n in enumerate(names) if k and n in ("", "nan")), len(names))
    df = raw.iloc[hdr + 1:, :end].copy()
    df.columns = names[:end]
    print(f"{os.path.basename(xlsx)} '{sheet}': header row {hdr}, columns {list(df.columns)}, {len(df):,} rows")

    value = next(c for c in df.columns if re.fullmatch(r"rig ?count( value)?|value", c))
    if "rig status" in df.columns:
        df = df[df["rig status"].astype(str).str.contains("active", case=False)]
    df["when"] = pd.to_datetime(dict(year=pd.to_numeric(df["year"], errors="coerce"),
                                     month=df["month"].map(_month), day=1), errors="coerce")
    df["v"] = pd.to_numeric(df[value], errors="coerce")
    df = df.dropna(subset=["when", "v"])
    ar = df[df["country"].astype(str).str.strip().str.upper().eq("ARGENTINA")].groupby("when")["v"].sum()
    la = df[df["region"].astype(str).str.contains("latin", case=False)].groupby("when")["v"].sum()
    return ar, la


def read_regional_history(xlsx):
    """Yearly blocks of regional totals (a row with the year and the region
    names, then Jan..Dec rows) -> Latin America monthly series."""
    raw = pd.read_excel(xlsx, sheet_name=0, header=None)
    out = {}
    year, col = None, None
    for _, row in raw.iterrows():
        cells = [_norm(v) for v in row.tolist()]
        if "latin america" in cells:
            col = cells.index("latin america")
            year = next((int(c[:4]) for c in cells if re.fullmatch(r"(19|20)\d\d( 0)?", c)), None)
            continue
        m = next((_month(v) for v in row.tolist() if isinstance(v, str) and _month(v)), None)
        if year and col is not None and m and not pd.isna(row.iloc[col]):
            out[pd.Timestamp(year, m, 1)] = float(row.iloc[col])
    s = pd.Series(out, dtype=float).sort_index()
    if len(s):
        print(f"{os.path.basename(xlsx)}: Latin America {s.index.min():%Y-%m}..{s.index.max():%Y-%m}")
    return s


def combine(series):
    """For each month, the value from the series that runs latest (the newest report)."""
    series = sorted((s for s in series if len(s)), key=lambda s: s.index.max())
    if not series:
        return pd.Series(dtype=float)
    out = pd.concat(series)
    return out[~out.index.duplicated(keep="last")].sort_index()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--xlsx", nargs="*", default=[], help="extra workbooks")
    parser.add_argument("--reference-dir", default=REFERENCE_DIR)
    parser.add_argument("--no-download", action="store_true")
    parser.add_argument("--out", default=OUTPUT_PATH)
    args = parser.parse_args()

    files = sorted(glob.glob(os.path.join(args.reference_dir, "*.xlsx"))) + list(args.xlsx)
    if not args.no_download:
        try:
            files.append(download(DOWNLOAD_PATH))
        except Exception as e:
            print(f"Download failed ({type(e).__name__}: {e}); using the reference workbooks")

    ar_parts, la_parts = [], []
    for f in files:
        try:
            got = read_monthly_report(f)
            if got:
                ar_parts.append(got[0])
                la_parts.append(got[1])
            else:
                la_parts.append(read_regional_history(f))
        except Exception as e:
            print(f"Skipped {os.path.basename(f)}: {type(e).__name__}: {e}")

    indicators = []
    for parts, key, name, start in [
        (ar_parts, "rig_count", "Active rigs in Argentina (Baker Hughes)", "2009-01"),
        (la_parts, "rig_count_latam", "Active rigs in Latin America (Baker Hughes)", "2007-01"),
    ]:
        s = combine(parts)
        if s.empty:
            print(f"{name}: no data")
            continue
        missing = pd.date_range(s.index.min(), s.index.max(), freq="MS").difference(s.index)
        if len(missing):
            print(f"{name}: {len(missing)} months missing, e.g. {[f'{m:%Y-%m}' for m in missing[:5]]}")
        df = pd.DataFrame({"indice_tiempo": s.index, "cantidad": s.values})
        indicators.append(monthly_candles(df, key, name, "rigs", source=SOURCE, start=start))
    if not indicators:
        print("Rig count not updated: no workbook could be read", file=sys.stderr)
        return
    write({"indicators": indicators}, args.out)


if __name__ == "__main__":
    main()
