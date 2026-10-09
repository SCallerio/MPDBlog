# script/process_fractura.py
"""
Build the data for the frac line races: cumulative lateral length and
cumulative frac stages per company.

Source: Secretaría de Energía (Argentina) - Datos de fractura de pozos de
hidrocarburos (Adjunto IV, daily update)
  http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7

Columns used:
  fecha_fin_fractura          -> time (frac end date, binned by month)
  empresa_informante          -> company (one line per company)
  longitud_rama_horizontal_m  -> lateral length, meters
  cantidad_fracturas          -> frac stages

Output:
  data/processed/fractura_lateral_cumsum.json  [["mes","empresa","lateral_m_acumulado"], ...]
  data/processed/fractura_etapas_cumsum.json   [["mes","empresa","etapas_acumuladas"], ...]

Usage:
  python script/process_fractura.py                # top 8 companies
  python script/process_fractura.py --csv local.csv --top 0
"""
import argparse
import os
import re

import pandas as pd

from line_race_data import MAX_LABEL_LEN, build_cumsum, load_csv, write_json

WEB_LINK = (
    "http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7/"
    "resource/2280ad92-6ed3-403e-a095-50139863ab0d/download/"
    "datos-de-fractura-de-pozos-de-hidrocarburos-adjunto-iv-actualizacin-diaria.csv"
)
OUT_DIR = os.path.join("data", "processed")

TIME_COL = "fecha_fin_fractura"
HUE_COL = "empresa_informante"
SERIES = [
    # (value column, output value name, output file, description)
    ("longitud_rama_horizontal_m", "lateral_m_acumulado", "fractura_lateral_cumsum.json",
     "cumulative lateral length (m)"),
    ("cantidad_fracturas", "etapas_acumuladas", "fractura_etapas_cumsum.json",
     "cumulative frac stages"),
]

# Same operator reported under different legal entities / spellings, merged
# into one line (as in the meters-drilled race, PAE LLC -> Pan American Energy SL).
NAME_RULES = [
    (re.compile(r"^PAN AMERICAN ENERGY\b"), "PAN AMERICAN ENERGY"),
]


def clean_company(name):
    name = re.sub(r"\s+", " ", str(name)).strip().upper()
    for pattern, canonical in NAME_RULES:
        if pattern.search(name):
            return canonical
    return name


def parse_dates(s):
    """ISO dates first; fall back to day-first (dd/mm/yyyy) when that parses more."""
    iso = pd.to_datetime(s, errors="coerce", format="mixed")
    if iso.notna().mean() > 0.9:
        return iso
    dayfirst = pd.to_datetime(s, errors="coerce", format="mixed", dayfirst=True)
    return iso if iso.notna().sum() >= dayfirst.notna().sum() else dayfirst


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", default=WEB_LINK, help="URL or local path of the fractura CSV")
    parser.add_argument("--top", type=int, default=8, help="companies to keep (0 = all)")
    parser.add_argument("--max-label", type=int, default=MAX_LABEL_LEN,
                        help="longest company name shown; longer ones are shortened")
    parser.add_argument("--out-dir", default=OUT_DIR)
    args = parser.parse_args()

    df = load_csv(args.csv)
    print(df[[TIME_COL, HUE_COL] + [s[0] for s in SERIES]].head(5).to_string())

    df[TIME_COL] = parse_dates(df[TIME_COL])
    # Drop impossible dates (typos such as year 1900 or 2205).
    today = pd.Timestamp.today()
    bad = df[TIME_COL].isna() | (df[TIME_COL] < "2000-01-01") | (df[TIME_COL] > today)
    print(f"\nDates {df.loc[~bad, TIME_COL].min():%Y-%m-%d} .. {df.loc[~bad, TIME_COL].max():%Y-%m-%d}; "
          f"dropped {bad.sum():,} rows with missing/out-of-range {TIME_COL}")
    df = df[~bad]
    df[HUE_COL] = df[HUE_COL].map(clean_company)

    for value_col, value_name, out_file, what in SERIES:
        print(f"\n=== {what} ===")
        long, ranking = build_cumsum(
            df, time_col=TIME_COL, value_col=value_col, hue_col=HUE_COL,
            top_n=args.top, max_label_len=args.max_label, value_name=value_name)
        write_json(long, os.path.join(args.out_dir, out_file))
        print(ranking.head(args.top if args.top > 0 else 20).to_string())


if __name__ == "__main__":
    main()
