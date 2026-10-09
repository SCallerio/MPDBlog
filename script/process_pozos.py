# script/process_pozos.py
"""
Monthly activity candles from the Secretaría de Energía well counts
(dataset "Perforación de pozos de petróleo y gas"):

  Pozos en perforación  -> wells being drilled each month (proxy for active rigs)
  Pozos terminados      -> wells completed each month

Output: data/processed/pozos_velas.json  {"indicators": [...]}, same shape as
the "indicators" of fractura_velas.json (see energy_charts_data.py).

Usage:
  python script/process_pozos.py --perforacion pozos-en-perforacion.csv --terminados pozos-terminados.csv
"""
import argparse
import os

from energy_charts_data import monthly_candles, write
from line_race_data import load_csv

BASE = "http://datos.energia.gob.ar/dataset/7ea2ac77-d7a0-4129-9fbf-6f1a25d94e21/resource/"
PERFORACION_URL = BASE + "af6838ef-f675-4409-ac6a-e7c391a5dbab/download/pozos-en-perforacin.csv"
TERMINADOS_URL = BASE + "a2ce14af-5c56-45c2-9b9c-c7a1e5156dff/download/pozos-terminados.csv"
OUTPUT_PATH = os.path.join("data", "processed", "pozos_velas.json")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--perforacion", default=PERFORACION_URL)
    parser.add_argument("--terminados", default=TERMINADOS_URL)
    parser.add_argument("--out", default=OUTPUT_PATH)
    args = parser.parse_args()

    indicators = []
    for src, key, name, unit in [
        (args.perforacion, "wells_drilling", "Wells being drilled (rig activity proxy)", "wells"),
        (args.terminados, "wells_completed", "Wells completed per month", "wells"),
    ]:
        df = load_csv(src)
        print(df.head(3).to_string())
        indicators.append(monthly_candles(
            df, key, name, unit, source="Perforación de pozos de petróleo y gas"))
    write({"indicators": indicators}, args.out)


if __name__ == "__main__":
    main()
