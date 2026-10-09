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

Output: data/processed/metros_perforados_cumsum.json
  [["mes", "empresa", "metros_acumulados"], ["2009-01", "YPF S.A.", 12345.0], ...]

Usage:
  python script/process_metros_perforados.py               # top 8 companies
  python script/process_metros_perforados.py --top 0       # every company
  python script/process_metros_perforados.py --csv local.csv
"""
import argparse
import os

from line_race_data import MAX_LABEL_LEN, build_cumsum, load_csv, write_json

WEB_LINK = (
    "http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21/"
    "resource/712805f3-35d4-4825-93c6-98d03aeca203/download/metros-perforados.csv"
)
OUTPUT_PATH = os.path.join("data", "processed", "metros_perforados_cumsum.json")

# Company codes that are the same operator under a new legal entity, merged
# into a single line. Pan American Energy (Sucursal Argentina) LLC (PAE) stops
# reporting in Dec 2018, the month Pan American Energy SL (PAL) starts.
COMPANY_ALIASES = {"PAL": "PAE"}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", default=WEB_LINK, help="URL or local path of metros-perforados.csv")
    parser.add_argument("--top", type=int, default=8, help="companies to keep (0 = all)")
    parser.add_argument("--max-label", type=int, default=MAX_LABEL_LEN,
                        help="longest company name shown; longer ones use idempresa")
    parser.add_argument("--out", default=OUTPUT_PATH)
    args = parser.parse_args()

    df = load_csv(args.csv)
    long, ranking = build_cumsum(
        df, time_col="indice_tiempo", value_col="cantidad", hue_col="idempresa",
        name_col="empresa", top_n=args.top, max_label_len=args.max_label,
        aliases=COMPANY_ALIASES, value_name="metros_acumulados")
    write_json(long, args.out)
    print("\nTop companies by cumulative meters drilled:")
    print(ranking.head(args.top if args.top > 0 else 20).to_string())


if __name__ == "__main__":
    main()
