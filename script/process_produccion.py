# script/process_produccion.py
"""
Production and well-location data (Secretaría de Energía, "Producción de
petróleo y gas por pozo (Capítulo IV)" and "Concesiones de Explotación"):

  Production bar races per concession area (unconventional wells):
    data/processed/produccion_petroleo_areas.json   oil, bbl/d   [["mes","area","bbl_d","operador"], ...]
    data/processed/produccion_gas_areas.json        gas, MMm3/d  [["mes","area","mmm3_d","operador"], ...]
  Wells drilled since 2010 on a concession-area map:
    data/processed/pozos_mapa.json                  {years, areas: {year: [{name, value}]}, wells: [[lon, lat, year, type]]}
    assets/data/argentina-concesiones.json          simplified concession polygons (GeoJSON)

Usage (files already downloaded):
  python script/process_produccion.py --prod prod.csv --pozos pozos.csv \
      --pozos-shp shapefile-de-pozos.zip --concesiones concesiones.zip
"""
import argparse
import glob
import io
import json
import os
import re
import tempfile
import unicodedata
import zipfile

import pandas as pd

from energy_charts_data import title_es, write

OUT_DIR = os.path.join("data", "processed")
GEO_OUT = os.path.join("assets", "data", "argentina-concesiones.json")
M3_TO_BBL = 6.28981
KM3_GAS_TO_BOE = 5.89
START_YEAR = 2010
TOP_AREAS = 15


def _key(name):
    s = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]+", " ", s.upper()).strip()


def area_label(name):
    return title_es(re.sub(r"\s+", " ", str(name)).strip())


# --- Production bar races ----------------------------------------------------

def production_races(prod):
    d = prod[["anio", "mes", "areapermisoconcesion", "empresa", "prod_pet", "prod_gas"]].copy()
    d["month"] = pd.to_datetime(dict(year=d["anio"], month=d["mes"], day=1), errors="coerce")
    d = d.dropna(subset=["month"])
    d["area"] = d["areapermisoconcesion"].map(area_label)
    monthly = d.groupby(["month", "area"])[["prod_pet", "prod_gas"]].sum()
    days = monthly.index.get_level_values("month").days_in_month
    monthly["bbl_d"] = monthly["prod_pet"] * M3_TO_BBL / days
    monthly["mmm3_d"] = monthly["prod_gas"] / 1000 / days  # prod_gas is in thousand m3

    # The last month is often still being reported: drop trailing months whose
    # total falls below 70% of the month before.
    totals = monthly.groupby(level="month")["bbl_d"].sum()
    end = totals.index.max()
    while len(totals) > 2 and totals[end] < 0.7 * totals[totals.index < end].iloc[-1]:
        print(f"Dropping {end:%Y-%m}: total {totals[end]:,.0f} bbl/d looks incomplete")
        totals = totals[totals.index < end]
        end = totals.index.max()
    monthly = monthly[monthly.index.get_level_values("month") <= end]
    monthly = monthly[monthly.index.get_level_values("month") >= pd.Timestamp(f"{START_YEAR}-01-01")]

    # Main operator of each area: the company with the most oil + gas there, in
    # barrels of oil equivalent (1,000 m3 of gas = 35,315 ft3 ~ 5.89 boe).
    op = (d.assign(w=d["prod_pet"] * M3_TO_BBL + d["prod_gas"] * KM3_GAS_TO_BOE)
            .groupby(["area", "empresa"])["w"].sum().reset_index()
            .sort_values("w").drop_duplicates("area", keep="last").set_index("area")["empresa"])

    out = {}
    for col, key, digits in [("bbl_d", "oil", 0), ("mmm3_d", "gas", 3)]:
        piv = monthly[col].unstack(fill_value=0)
        top = piv.max().nlargest(TOP_AREAS).index
        rows = [["mes", "area", col, "operador"]]
        for m, r in piv[top].iterrows():
            for a in top:
                rows.append([f"{m:%Y-%m}", a, round(float(r[a]), digits), str(op.get(a, "")).strip()])
        out[key] = rows
        print(f"{key}: {len(piv)} months to {piv.index.max():%Y-%m}; top areas {list(top[:5])}")
    return out


# --- Wells and concession areas ----------------------------------------------

def _point_from_geojson(s):
    try:
        g = json.loads(s)
        x, y = g["coordinates"][:2]
        return float(x), float(y)
    except Exception:
        m = re.search(r"POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)", str(s))
        return (float(m.group(1)), float(m.group(2))) if m else (None, None)


def wells_table(pozos, pozos_shp_zip):
    w = pozos.copy()
    xy = w["geojson"].map(_point_from_geojson) if "geojson" in w.columns else pd.Series([(None, None)] * len(w))
    w["lon"] = [p[0] for p in xy]
    w["lat"] = [p[1] for p in xy]
    ok = w["lon"].notna().mean()
    print(f"Wells CSV: {len(w):,} rows, coordinates parsed from geojson for {ok:.0%}")
    if ok < 0.9 and pozos_shp_zip:
        import shapefile
        with tempfile.TemporaryDirectory() as tmp:
            zipfile.ZipFile(pozos_shp_zip).extractall(tmp)
            shp = glob.glob(os.path.join(tmp, "**", "*.shp"), recursive=True)[0]
            r = shapefile.Reader(shp)
            names = [f[0] for f in r.fields[1:]]
            pts = {}
            for rec, shape in zip(r.records(), r.shapes()):
                if shape.points:
                    pts[str(rec[names.index("SIGLA")]).strip()] = shape.points[0]
        miss = w["lon"].isna()
        w.loc[miss, "lon"] = w.loc[miss, "sigla"].astype(str).str.strip().map(lambda s: pts.get(s, (None, None))[0])
        w.loc[miss, "lat"] = w.loc[miss, "sigla"].astype(str).str.strip().map(lambda s: pts.get(s, (None, None))[1])
        print(f"  after the shapefile join: {w['lon'].notna().mean():.0%} with coordinates")
    w["start"] = pd.to_datetime(w["adjiv_fecha_inicio_perf"], errors="coerce")
    w = w[(w["start"] >= pd.Timestamp(f"{START_YEAR}-01-01")) & (w["start"] <= pd.Timestamp.today())]
    w = w.dropna(subset=["lon", "lat"])
    w = w[w["lon"].between(-75, -53) & w["lat"].between(-56, -21)]
    w["year"] = w["start"].dt.year
    w["type"] = w["tipo_recurso"].astype(str).str.upper().map(
        lambda t: "Unconventional" if t.startswith("NO CONV") else ("Conventional" if t.startswith("CONV") else "Other"))
    print(f"Wells with a drilling start since {START_YEAR} and coordinates: {len(w):,}; "
          f"{w['type'].value_counts().to_dict()}")
    return w


def concession_map(conc_zip, tolerance=0.003):
    import shapefile
    from pyproj import CRS, Transformer
    from shapely.geometry import mapping, shape
    from shapely.ops import transform

    with tempfile.TemporaryDirectory() as tmp:
        zipfile.ZipFile(conc_zip).extractall(tmp)
        shp = glob.glob(os.path.join(tmp, "**", "*.shp"), recursive=True)[0]
        prj = glob.glob(os.path.join(tmp, "**", "*.prj"), recursive=True)
        crs = CRS.from_wkt(open(prj[0]).read()) if prj else CRS.from_epsg(4326)
        r = shapefile.Reader(shp, encoding="utf-8", encodingErrors="replace")
        fields = [f[0] for f in r.fields[1:]]
        print(f"Concessions shapefile: {len(r)} shapes, CRS {crs.name}, fields {fields}")
        name_field = next((f for f in fields if re.fullmatch(r"(NOMBRE|AREA|NOMBRE_ARE|AREA_CONCE|AREAPERMIS\w*)", f.upper())),
                          next((f for f in fields if "NOMB" in f.upper() or "AREA" in f.upper()), fields[0]))
        print(f"  name field: {name_field}; examples {[rec[fields.index(name_field)] for rec in r.records()[:5]]}")
        to_wgs = None if crs.to_epsg() == 4326 else Transformer.from_crs(crs, 4326, always_xy=True).transform
        feats = []
        for rec, shp_ in zip(r.records(), r.shapes()):
            if not shp_.points:
                continue
            g = shape(shp_.__geo_interface__)
            if to_wgs:
                g = transform(to_wgs, g)
            g = g.simplify(tolerance, preserve_topology=True)
            if g.is_empty:
                continue
            gj = json.loads(json.dumps(mapping(g)), parse_float=lambda x: round(float(x), 4))
            feats.append({"type": "Feature",
                          "properties": {"name": area_label(rec[fields.index(name_field)])},
                          "geometry": gj})
    return {"type": "FeatureCollection", "features": feats}


def wells_map(wells, geo):
    names = {_key(f["properties"]["name"]): f["properties"]["name"] for f in geo["features"]}
    wells = wells.copy()
    wells["area_name"] = wells["area"].map(lambda a: names.get(_key(a)))
    matched = wells["area_name"].notna().mean()
    print(f"Wells matched to a concession polygon by area name: {matched:.0%}")
    years = list(range(START_YEAR, int(wells["year"].max()) + 1))
    areas = {}
    for y in years:
        c = wells[wells["year"] <= y].dropna(subset=["area_name"]).groupby("area_name").size()
        areas[str(y)] = [{"name": a, "value": int(v)} for a, v in c.items()]
    last = wells["start"].max()
    partial = None if (last.month == 12) else f"{last.year} (Jan–{last:%b})"
    return {
        "years": [str(y) for y in years],
        "partial_year": partial,
        "types": ["Conventional", "Unconventional", "Other"],
        "areas": areas,
        "wells": [[round(float(r.lon), 4), round(float(r.lat), 4), int(r.year),
                   ["Conventional", "Unconventional", "Other"].index(r.type)]
                  for r in wells.itertuples()],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--prod", required=True)
    parser.add_argument("--pozos", required=True)
    parser.add_argument("--pozos-shp")
    parser.add_argument("--concesiones", required=True)
    parser.add_argument("--out-dir", default=OUT_DIR)
    parser.add_argument("--geo-out", default=GEO_OUT)
    args = parser.parse_args()

    prod = pd.read_csv(args.prod, low_memory=False,
                       usecols=["anio", "mes", "areapermisoconcesion", "empresa", "prod_pet", "prod_gas"])
    races = production_races(prod)
    write(races["oil"], os.path.join(args.out_dir, "produccion_petroleo_areas.json"))
    write(races["gas"], os.path.join(args.out_dir, "produccion_gas_areas.json"))

    geo = concession_map(args.concesiones)
    write(geo, args.geo_out)
    pozos = pd.read_csv(args.pozos, low_memory=False)
    write(wells_map(wells_table(pozos, args.pozos_shp), geo), os.path.join(args.out_dir, "pozos_mapa.json"))


if __name__ == "__main__":
    main()
