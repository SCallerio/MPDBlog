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

Outputs:
  data/processed/metros_perforados_cumsum.json      one line per company
    [["mes", "empresa", "metros_acumulados"], ["2009-01", "YPF S.A.", 12345.0], ...]
  data/processed/metros_perforados_ypf_cumsum.json  YPF only, one line per field
    (areayacimiento)  [["mes", "yacimiento", "metros_acumulados"], ...]
  data/processed/metros_perforados_cumsum_top15.json  bar race (top 15 companies)
  data/processed/metros_perforados_provincia_anio.json  choropleth map by province/year
  data/processed/metros_perforados_arbol.json  basin -> province -> company treemap

Usage:
  python script/process_metros_perforados.py               # top 8 companies
  python script/process_metros_perforados.py --top 0       # every company
  python script/process_metros_perforados.py --csv local.csv
"""
import argparse
import os

from energy_charts_data import drilldown_tree, province_year_map, write
from line_race_data import MAX_LABEL_LEN, build_cumsum, load_csv, write_json

WEB_LINK = (
    "http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21/"
    "resource/712805f3-35d4-4825-93c6-98d03aeca203/download/metros-perforados.csv"
)
OUTPUT_PATH = os.path.join("data", "processed", "metros_perforados_cumsum.json")
YPF_OUTPUT_PATH = os.path.join("data", "processed", "metros_perforados_ypf_cumsum.json")
OUT_DIR = os.path.join("data", "processed")

# Company codes that are the same operator under a new legal entity, merged
# into a single line. Pan American Energy (Sucursal Argentina) LLC (PAE) stops
# reporting in Dec 2018, the month Pan American Energy SL (PAL) starts.
COMPANY_ALIASES = {"PAL": "PAE"}
# Field names have no legal suffixes to drop; allow a little more room so
# e.g. "CAÑADON DE LA ESCONDIDA" (23 chars) is not cut.
FIELD_MAX_LABEL_LEN = 24
# Bar-race labels sit on the y axis and have more room than end labels.
BAR_RACE_MAX_LABEL_LEN = 32


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", default=WEB_LINK, help="URL or local path of metros-perforados.csv")
    parser.add_argument("--top", type=int, default=8, help="companies to keep (0 = all)")
    parser.add_argument("--max-label", type=int, default=MAX_LABEL_LEN,
                        help="longest company name shown; longer ones use idempresa")
    parser.add_argument("--out", default=OUTPUT_PATH)
    parser.add_argument("--ypf-out", default=YPF_OUTPUT_PATH)
    args = parser.parse_args()

    df = load_csv(args.csv)
    long, ranking = build_cumsum(
        df, time_col="indice_tiempo", value_col="cantidad", hue_col="idempresa",
        name_col="empresa", top_n=args.top, max_label_len=args.max_label,
        aliases=COMPANY_ALIASES, value_name="metros_acumulados")
    write_json(long, args.out)
    print("\nTop companies by cumulative meters drilled:")
    print(ranking.head(args.top if args.top > 0 else 20).to_string())

    # YPF only, one line per field (areayacimiento).
    ypf = df[df["idempresa"].astype(str).str.strip() == "YPF"]
    long, ranking = build_cumsum(
        ypf, time_col="indice_tiempo", value_col="cantidad", hue_col="areayacimiento",
        top_n=args.top, max_label_len=max(args.max_label, FIELD_MAX_LABEL_LEN),
        value_name="metros_acumulados")
    long = long.rename(columns={"empresa": "yacimiento"})
    write_json(long, args.ypf_out)
    print("\nYPF: top fields by cumulative meters drilled:")
    print(ranking.head(args.top if args.top > 0 else 20).to_string())

    # Bar race: a wider pool (top 15) so companies can enter the top 10 shown.
    long, _ = build_cumsum(
        df, time_col="indice_tiempo", value_col="cantidad", hue_col="idempresa",
        name_col="empresa", top_n=15, max_label_len=BAR_RACE_MAX_LABEL_LEN,
        aliases=COMPANY_ALIASES, value_name="metros_acumulados", shorten_names=True)
    write_json(long, os.path.join(OUT_DIR, "metros_perforados_cumsum_top15.json"))

    # Choropleth map (per province and year) and basin -> province -> company tree.
    write(province_year_map(df), os.path.join(OUT_DIR, "metros_perforados_provincia_anio.json"))
    write(drilldown_tree(df, company_aliases=COMPANY_ALIASES, company_labels={"PAE": "PAN AMERICAN ENERGY"}),
          os.path.join(OUT_DIR, "metros_perforados_arbol.json"))


if __name__ == "__main__":
    main()
