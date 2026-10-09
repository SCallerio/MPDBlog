# script/process_fractura.py
"""
Build the data for the frac charts: quarterly line races of average lateral
length, average frac stages and stages per 1,000 m per company, plus the
bubble chart and the activity candles.

Source: Secretaría de Energía (Argentina) - Datos de fractura de pozos de
hidrocarburos (Adjunto IV, daily update)
  http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7

Columns used:
  fecha_fin_fractura          -> time (frac end date, binned by month)
  empresa_informante          -> company (one line per company)
  longitud_rama_horizontal_m  -> lateral length, meters
  cantidad_fracturas          -> frac stages

Output:
  data/processed/fractura_lateral_trimestral.json   [["trimestre","empresa","lateral"], ...]
  data/processed/fractura_etapas_trimestral.json    [["trimestre","empresa","stages"], ...]
  data/processed/fractura_densidad_trimestral.json  [["trimestre","empresa","density"], ...]
  data/processed/fractura_burbujas.json        bubble chart: per company and year
  data/processed/fractura_velas.json           monthly activity candles

Usage:
  python script/process_fractura.py                # top 8 companies, from 2015-01
  python script/process_fractura.py --start 2018-01
  python script/process_fractura.py --csv local.csv --top 0
"""
import argparse
import os
import re

import pandas as pd

from energy_charts_data import frac_bubbles, frac_candles, frac_quarterly_averages, write
from line_race_data import MAX_LABEL_LEN, load_csv

WEB_LINK = (
    "http://datos.energia.gob.ar/dataset/71fa2e84-0316-4a1b-af68-7f35e41f58d7/"
    "resource/2280ad92-6ed3-403e-a095-50139863ab0d/download/"
    "datos-de-fractura-de-pozos-de-hidrocarburos-adjunto-iv-actualizacin-diaria.csv"
)
OUT_DIR = os.path.join("data", "processed")
# Reporting is sparse before 2015 (<1% of the total), so the charts start there.
START = "2015-01"

TIME_COL = "fecha_fin_fractura"
HUE_COL = "empresa_informante"
VALUE_COLS = ["longitud_rama_horizontal_m", "cantidad_fracturas"]
QUARTERLY_OUTPUTS = {
    "lateral": "fractura_lateral_trimestral.json",
    "stages": "fractura_etapas_trimestral.json",
    "density": "fractura_densidad_trimestral.json",
}

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
    parser.add_argument("--start", default=START, help="first month shown (YYYY-MM); '' = all")
    parser.add_argument("--out-dir", default=OUT_DIR)
    args = parser.parse_args()

    df = load_csv(args.csv)
    print(df[[TIME_COL, HUE_COL] + VALUE_COLS].head(5).to_string())

    df[TIME_COL] = parse_dates(df[TIME_COL])
    # Drop impossible dates (typos such as year 1900 or 2205).
    today = pd.Timestamp.today()
    bad = df[TIME_COL].isna() | (df[TIME_COL] < "2000-01-01") | (df[TIME_COL] > today)
    print(f"\nDates {df.loc[~bad, TIME_COL].min():%Y-%m-%d} .. {df.loc[~bad, TIME_COL].max():%Y-%m-%d}; "
          f"dropped {bad.sum():,} rows with missing/out-of-range {TIME_COL}")
    df = df[~bad]
    df[HUE_COL] = df[HUE_COL].map(clean_company)

    start = args.start or "2015-01"
    tables = frac_quarterly_averages(df, TIME_COL, HUE_COL, start=start, top_n=args.top,
                                     max_label_len=args.max_label)
    for key, out_file in QUARTERLY_OUTPUTS.items():
        write(tables[key], os.path.join(args.out_dir, out_file))
    write(frac_bubbles(df, TIME_COL, HUE_COL, start=start, top_n=args.top),
          os.path.join(args.out_dir, "fractura_burbujas.json"))
    write(frac_candles(df, TIME_COL, start=start),
          os.path.join(args.out_dir, "fractura_velas.json"))


if __name__ == "__main__":
    main()
