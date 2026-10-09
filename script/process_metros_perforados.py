# script/process_metros_perforados.py
"""
Build the data for the "meters drilled" ECharts line race.

Source: Secretaría de Energía (Argentina) - Metros perforados
  http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21

Columns used:
  indice_tiempo -> time (monthly)
  cantidad      -> meters drilled in the month
  idempresa     -> company ID (one line per company)
  empresa       -> company name, used as label when it is short enough

Output (data/processed/metros_perforados_cumsum.json) is a long-format
table ready for an ECharts `dataset`, same shape as the line-race example:
  [["mes", "empresa", "metros_acumulados"], ["2009-01", "YPF", 12345.0], ...]

Usage:
  python script/process_metros_perforados.py               # top 8 companies
  python script/process_metros_perforados.py --top 0       # every company
  python script/process_metros_perforados.py --csv local.csv
"""
import argparse
import io
import json
import os
import sys

import pandas as pd
import requests

WEB_LINK = (
    "http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21/"
    "resource/712805f3-35d4-4825-93c6-98d03aeca203/download/metros-perforados.csv"
)
OUTPUT_PATH = os.path.join("data", "processed", "metros_perforados_cumsum.json")

TIME_COL = "indice_tiempo"
VALUE_COL = "cantidad"
HUE_COL = "idempresa"
NAME_COL = "empresa"
# Company names longer than this are labelled with their idempresa code instead
# (e.g. "PAN AMERICAN ENERGY (SUCURSAL ARGENTINA) LLC" -> "PAE").
MAX_LABEL_LEN = 22
# Company codes that are the same operator under a new legal entity, merged
# into a single line. Pan American Energy (Sucursal Argentina) LLC (PAE) stops
# reporting in Dec 2018, the month Pan American Energy SL (PAL) starts.
COMPANY_ALIASES = {"PAL": "PAE"}


def load_csv(source):
    if source.startswith("http"):
        print(f"Downloading {source} ...")
        resp = requests.get(source, timeout=120)
        resp.raise_for_status()
        raw = resp.content
    else:
        with open(source, "rb") as f:
            raw = f.read()

    # datos.energia.gob.ar files are usually UTF-8, older ones latin1.
    for enc in ("utf-8-sig", "latin1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    return pd.read_csv(io.StringIO(text), low_memory=False)


def build_cumsum(df, top_n, max_label_len=MAX_LABEL_LEN):
    df.columns = [c.strip().lower() for c in df.columns]
    missing = [c for c in (TIME_COL, VALUE_COL, HUE_COL) if c not in df.columns]
    if missing:
        print(f"Error: missing columns {missing}. Available: {list(df.columns)}")
        sys.exit(1)

    df[TIME_COL] = pd.to_datetime(df[TIME_COL], errors="coerce")
    df[VALUE_COL] = pd.to_numeric(df[VALUE_COL], errors="coerce").fillna(0)
    df = df.dropna(subset=[TIME_COL, HUE_COL])
    df[TIME_COL] = df[TIME_COL].dt.to_period("M").dt.to_timestamp()
    # Names come from each code's own rows, before the aliases are merged, so a
    # merged line keeps the canonical company's name (or its code).
    names = {}
    if NAME_COL in df.columns:
        names = (df.dropna(subset=[NAME_COL])
                   .groupby(HUE_COL)[NAME_COL]
                   .agg(lambda s: s.str.strip().mode().iat[0]))
    df[HUE_COL] = df[HUE_COL].replace(COMPANY_ALIASES)

    # Monthly meters per company, on a complete month grid so that months with
    # no drilling keep the cumulative line flat instead of breaking it.
    monthly = df.pivot_table(index=TIME_COL, columns=HUE_COL, values=VALUE_COL,
                             aggfunc="sum", fill_value=0)
    full_idx = pd.date_range(monthly.index.min(), monthly.index.max(), freq="MS")
    monthly = monthly.reindex(full_idx, fill_value=0)
    cumsum = monthly.cumsum()

    # Keep the companies with the most cumulative meters (a race with dozens of
    # lines is unreadable).
    ranking = cumsum.iloc[-1].sort_values(ascending=False)
    if top_n > 0:
        cumsum = cumsum[ranking.index[:top_n]]

    # Label: company name (most frequent spelling), or the idempresa code when
    # the name is missing or too long to fit as an end label.
    labels = {}
    for c in cumsum.columns:
        name = names.get(c)
        labels[c] = name if name and len(name) <= max_label_len else str(c)

    long = cumsum.rename(columns=labels).stack().reset_index()
    long.columns = ["mes", "empresa", "metros_acumulados"]
    long["mes"] = long["mes"].dt.strftime("%Y-%m")
    # Before a company's first meter there is nothing to plot (and 0 has no
    # place on the chart's log axis): null, not dropped, so every line has the
    # same months and the race animation stays in sync.
    long["metros_acumulados"] = long["metros_acumulados"].round(1).astype(object)
    long.loc[long["metros_acumulados"] <= 0, "metros_acumulados"] = None
    return long, ranking


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", default=WEB_LINK, help="URL or local path of metros-perforados.csv")
    parser.add_argument("--top", type=int, default=8, help="companies to keep (0 = all)")
    parser.add_argument("--max-label", type=int, default=MAX_LABEL_LEN,
                        help="longest company name shown; longer ones use idempresa")
    parser.add_argument("--out", default=OUTPUT_PATH)
    args = parser.parse_args()

    df = load_csv(args.csv)
    print(f"Loaded {len(df):,} rows, columns: {list(df.columns)}")

    long, ranking = build_cumsum(df, args.top, args.max_label)

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    rows = [list(long.columns)] + long.values.tolist()
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Saved {len(rows) - 1:,} points "
          f"({long['empresa'].nunique()} companies, {long['mes'].nunique()} months) to {args.out}")
    print("\nTop companies by cumulative meters drilled:")
    print(ranking.head(args.top if args.top > 0 else 20).to_string())


if __name__ == "__main__":
    main()
