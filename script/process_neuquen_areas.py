# script/process_neuquen_areas.py
"""
Neuquén hydrocarbon blocks for the Vaca Muerta block map.

Geometry and block attributes come from the Neuquén Ministry of Energy's
public GeoServer (the same source Superficiaria's blocks layer uses):
  https://hidrocarburos.energianeuquen.gob.ar/geoserver/wfs
    Hidrocarburos:Areas                  245 blocks: name, contract type, operator,
                                         holders and shares, area, contract dates
    Hidrocarburos:VM_Distribucion_Fluidos  Vaca Muerta fluid windows
Per-block activity comes from the national Capítulo IV files already used by
process_produccion.py (unconventional production, wells register).

Outputs:
  assets/data/neuquen-areas.json        simplified blocks + fluid windows (GeoJSON, two collections)
  data/processed/neuquen_areas.json     per-block attributes and metrics

Usage:
  python script/process_neuquen_areas.py --prod prod.csv --pozos pozos.csv [--pozos-shp shapefile-de-pozos.zip]
"""
import argparse
import json
import os
import re
import unicodedata

import pandas as pd
import requests

from energy_charts_data import title_es, write

WFS = "https://hidrocarburos.energianeuquen.gob.ar/geoserver/wfs"
GEO_OUT = os.path.join("assets", "data", "neuquen-areas.json")
DATA_OUT = os.path.join("data", "processed", "neuquen_areas.json")
M3_TO_BBL = 6.28981
START_YEAR = 2010

CONTRACT_GROUPS = [
    (r"NO CONVENCIONAL", "Unconventional concession"),
    (r"PERMISO DE EXPLORACION", "Exploration permit"),
    (r"CONCESION DE EXPLOTACION|LOTE DE EXPLOTACION", "Conventional concession"),
    (r"SIN CONTRATO|REVERSION", "No contract / reverted"),
]


def _key(name):
    s = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode().upper()
    s = re.sub(r"\(.*?\)", " ", s)
    return re.sub(r"[^A-Z0-9]+", " ", s).strip()


def contract_group(tipo):
    t = _key(tipo)
    for pattern, label in CONTRACT_GROUPS:
        if re.search(pattern, t):
            return label
    return "Other"


def wfs_features(layer):
    r = requests.get(WFS, params={"service": "WFS", "version": "2.0.0", "request": "GetFeature",
                                  "typeNames": layer, "outputFormat": "application/json",
                                  "srsName": "EPSG:4326"}, timeout=180)
    r.raise_for_status()
    feats = r.json()["features"]
    print(f"{layer}: {len(feats)} features; properties {list(feats[0]['properties']) if feats else []}")
    return feats


def simplify(geom, tolerance):
    from shapely.geometry import mapping, shape
    g = shape(geom).simplify(tolerance, preserve_topology=True)
    return json.loads(json.dumps(mapping(g)), parse_float=lambda x: round(float(x), 4))


def fluid_windows(feats):
    """Pick the attribute that names the fluid window (a text field with a
    handful of values) and dissolve the polygons by it."""
    from shapely.geometry import shape
    from shapely.ops import unary_union
    if not feats:
        return []
    props = pd.DataFrame([f["properties"] for f in feats])
    cands = [c for c in props.columns if props[c].dtype == object and 1 < props[c].nunique() <= 8]
    print(f"Fluid-window candidate fields: {[(c, props[c].unique().tolist()) for c in cands]}")
    field = next((c for c in cands if re.search(r"FLUID|VENTAN|TIPO|DESCR|NOMB", c, re.I)), cands[0] if cands else None)
    groups = {}
    for f in feats:
        name = str(f["properties"].get(field, "Vaca Muerta")).strip() if field else "Vaca Muerta"
        groups.setdefault(name, []).append(shape(f["geometry"]))
    out = []
    for name, shapes in groups.items():
        merged = unary_union(shapes)
        out.append({"type": "Feature", "properties": {"name": "vm:" + title_es(name)},
                    "geometry": simplify(merged.__geo_interface__, 0.005)})
    print(f"Fluid windows by '{field}': {sorted(groups)}")
    return out


def block_metrics(prod, pozos_wells, names):
    """Per block (matched by name): unconventional oil and gas over the last 12
    reported months, and unconventional wells drilled since START_YEAR."""
    by_key = {_key(n): n for n in names}
    p = prod.copy()
    p["month"] = pd.to_datetime(dict(year=p["anio"], month=p["mes"], day=1), errors="coerce")
    totals = p.groupby("month")["prod_pet"].sum()
    end = totals.index.max()
    while len(totals) > 2 and totals[end] < 0.7 * totals[totals.index < end].iloc[-1]:
        totals = totals[totals.index < end]
        end = totals.index.max()
    last12 = p[(p["month"] > end - pd.DateOffset(months=12)) & (p["month"] <= end)]
    days = 365.25
    last12 = last12.assign(block=last12["areapermisoconcesion"].map(lambda a: by_key.get(_key(a))))
    agg = last12.dropna(subset=["block"]).groupby("block")[["prod_pet", "prod_gas"]].sum()
    oil = (agg["prod_pet"] * M3_TO_BBL / days).round(0)
    gas = (agg["prod_gas"] / 1000 / days).round(3)
    matched = last12["block"].notna().mean()
    print(f"Production rows of the last 12 months ({end:%Y-%m}) matched to a Neuquén block: {matched:.0%}")

    w = pozos_wells.copy()
    w["block"] = w["area"].map(lambda a: by_key.get(_key(a)))
    w = w[w["type"] == "Unconventional"].dropna(subset=["block"])
    wells = w.groupby("block").size()
    last_year = int(w["year"].max()) if len(w) else None
    wells_last = w[w["year"] == last_year].groupby("block").size() if last_year else pd.Series(dtype=int)
    print(f"Unconventional wells since {START_YEAR} matched to a Neuquén block: {len(w):,}")
    return oil, gas, wells, wells_last, end, last_year


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--prod", required=True)
    parser.add_argument("--pozos", required=True)
    parser.add_argument("--pozos-shp")
    parser.add_argument("--geo-out", default=GEO_OUT)
    parser.add_argument("--out", default=DATA_OUT)
    args = parser.parse_args()

    from process_produccion import wells_table

    blocks = wfs_features("Hidrocarburos:Areas")
    try:
        windows = fluid_windows(wfs_features("Hidrocarburos:VM_Distribucion_Fluidos"))
    except Exception as e:  # the backdrop is optional
        print(f"Fluid windows unavailable: {e}")
        windows = []

    rows, geo = [], []
    for f in blocks:
        pr = f["properties"]
        name = title_es(re.sub(r"\s+", " ", str(pr.get("NOMBRE", ""))).strip())
        if not name or not f.get("geometry"):
            continue
        sup = pd.to_numeric(pr.get("SUP_LEGAL"), errors="coerce")
        rows.append({
            "name": name,
            "id": pr.get("ID_NQN"),
            "contract": contract_group(pr.get("TIPO_AREA", "")),
            "contract_raw": str(pr.get("TIPO_AREA", "")).strip().capitalize(),
            "operator": str(pr.get("OPERADOR") or "").strip() or None,
            "holders": str(pr.get("PARTICIPAC") or "").strip() or None,
            "area_km2": None if pd.isna(sup) else round(float(sup), 1),
            "start": str(pr.get("INI_CONTRATO") or "")[:10] or None,
            "end": str(pr.get("FIN_CONTRATO") or "")[:10] or None,
            "legal": str(pr.get("NORMA_LEGAL") or "").strip() or None,
        })
        geo.append({"type": "Feature", "properties": {"name": name}, "geometry": simplify(f["geometry"], 0.002)})

    prod = pd.read_csv(args.prod, low_memory=False,
                       usecols=["anio", "mes", "areapermisoconcesion", "prod_pet", "prod_gas"])
    wells = wells_table(pd.read_csv(args.pozos, low_memory=False), args.pozos_shp)
    oil, gas, nwells, nwells_last, end, last_year = block_metrics(prod, wells, [r["name"] for r in rows])
    for r in rows:
        r["oil_bbl_d"] = float(oil.get(r["name"], 0))
        r["gas_mmm3_d"] = float(gas.get(r["name"], 0))
        r["wells_unconv"] = int(nwells.get(r["name"], 0))
        r["wells_last_year"] = int(nwells_last.get(r["name"], 0))

    write({"type": "FeatureCollection", "features": geo, "windows": windows}, args.geo_out)
    write({
        "production_period": f"{(end - pd.DateOffset(months=11)):%Y-%m}–{end:%Y-%m}",
        "wells_since": START_YEAR,
        "wells_last_year": last_year,
        "contracts": [label for _, label in CONTRACT_GROUPS] + ["Other"],
        "blocks": rows,
    }, args.out)
    df = pd.DataFrame(rows)
    print(df["contract"].value_counts().to_dict())
    print(df.sort_values("oil_bbl_d", ascending=False)[["name", "operator", "oil_bbl_d", "gas_mmm3_d", "wells_unconv"]].head(8).to_string())


if __name__ == "__main__":
    main()
