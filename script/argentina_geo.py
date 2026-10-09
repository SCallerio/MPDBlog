# script/argentina_geo.py
"""
Argentine province names and the simplified province map used by the ECharts
choropleth (assets/data/argentina-provinces.json).

Build the map once (or whenever the source changes):
  git clone https://github.com/jazzido/Polymaps-Argentina /tmp/Polymaps-Argentina
  python script/argentina_geo.py /tmp/Polymaps-Argentina/provincias.json

Source geometry: jazzido/Polymaps-Argentina, provincias.json (13 MB GeoJSON),
simplified here to a few hundred KB for the web.
"""
import json
import os
import sys
import unicodedata

OUT_PATH = os.path.join("assets", "data", "argentina-provinces.json")

# Display names, keyed by an accent/case-insensitive form of any spelling used
# by the map or by datos.energia.gob.ar ("Rio Negro", "NEUQUEN", ...).
PROVINCES = [
    "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut",
    "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
    "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
]
ALIASES = {"capital federal": "Ciudad Autónoma de Buenos Aires", "caba": "Ciudad Autónoma de Buenos Aires"}


def _key(name):
    s = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode()
    return " ".join(s.lower().split())


_BY_KEY = {_key(p): p for p in PROVINCES}
_BY_KEY.update(ALIASES)


def canonical_province(name):
    """'Rio Negro' -> 'Río Negro'; names that are not provinces (e.g. 'Estado
    Nacional', the offshore federal jurisdiction) come back unchanged."""
    return _BY_KEY.get(_key(name), name)


def build_map(src, out_path=OUT_PATH, tolerance=0.02):
    from shapely.geometry import mapping, shape

    with open(src, encoding="utf-8") as f:
        geo = json.load(f)
    features = []
    for feat in geo["features"]:
        name = canonical_province(feat["properties"]["provincia"])
        geom = shape(feat["geometry"]).simplify(tolerance, preserve_topology=True)
        # Drop the tiny islands the simplification reduces to slivers.
        if geom.geom_type == "MultiPolygon":
            parts = [p for p in geom.geoms if p.area > tolerance ** 2]
            geom = type(geom)(parts) if parts else geom
        g = mapping(geom)
        # 3 decimals (~100 m) is plenty for a country-level choropleth.
        g = json.loads(json.dumps(g), parse_float=lambda x: round(float(x), 3))
        features.append({"type": "Feature", "properties": {"name": name}, "geometry": g})

    missing = set(PROVINCES) - {f["properties"]["name"] for f in features}
    if missing:
        print(f"Warning: provinces missing from the map: {sorted(missing)}")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f,
                  ensure_ascii=False, separators=(",", ":"))
    print(f"Saved {len(features)} provinces to {out_path} ({os.path.getsize(out_path) / 1024:.0f} KB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build_map(sys.argv[1])
