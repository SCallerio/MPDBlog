# script/line_race_data.py
"""
Shared helpers for the ECharts line-race data (assets/js/lineRace.js).

build_cumsum() turns a table of events (one row per record, with a date, a
company and a value) into a monthly cumulative sum per company, written as a
long-format table ready for an ECharts `dataset`:
  [["mes", "empresa", "<value>"], ["2009-01", "YPF S.A.", 12345.0], ...]

Used by script/process_metros_perforados.py and script/process_fractura.py.
"""
import io
import json
import os
import re
import sys

import pandas as pd
import requests

# Company names longer than this are shown as their ID (when the dataset has
# one) or as a shortened name.
MAX_LABEL_LEN = 22

LEGAL_SUFFIXES = re.compile(
    r"\s*(\(.*?\)|,?\s*\b(S\.?A\.?U?|S\.?R\.?L\.?|S\.?L\.?|S\.?A\.?S\.?|LLC|LTD\.?|INC\.?|"
    r"SUCURSAL ARGENTINA|ARGENTINA)\b\.?)\s*$",
    re.IGNORECASE,
)


def load_csv(source):
    if source.startswith("http"):
        print(f"Downloading {source} ...")
        resp = requests.get(source, timeout=300)
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
    df = pd.read_csv(io.StringIO(text), low_memory=False)
    df.columns = [c.strip().lower() for c in df.columns]
    print(f"Loaded {len(df):,} rows, columns: {list(df.columns)}")
    return df


def short_name(name, max_len):
    """'TECPETROL S.A.' fits as is; 'PAN AMERICAN ENERGY (SUCURSAL ARGENTINA) LLC'
    loses its legal suffixes, then is cut with an ellipsis if still too long."""
    if len(name) <= max_len:
        return name
    prev = None
    while prev != name:
        prev, name = name, LEGAL_SUFFIXES.sub("", name).strip(" ,.-")
    return name if len(name) <= max_len else name[: max_len - 1].rstrip() + "…"


def build_cumsum(df, time_col, value_col, hue_col, name_col=None, top_n=8,
                 max_label_len=MAX_LABEL_LEN, aliases=None, value_name="valor_acumulado",
                 start=None, shorten_names=False):
    """Monthly cumulative sum of `value_col` per `hue_col`.

    Labels: the most frequent `name_col` spelling when it fits in
    `max_label_len`, else the `hue_col` value when that is an ID (name_col
    given), else a shortened name. `aliases` merges hue values ({old: new}).
    `shorten_names` tries the name without legal suffixes before falling back
    to the ID. `start` ("2015-01") trims the months shown; totals still include the
    earlier history, so lines enter at their running total, not at zero.
    Returns (long DataFrame, final ranking Series).
    """
    missing = [c for c in (time_col, value_col, hue_col) if c not in df.columns]
    if missing:
        print(f"Error: missing columns {missing}. Available: {list(df.columns)}")
        sys.exit(1)

    df = df.copy()
    df[time_col] = pd.to_datetime(df[time_col], errors="coerce")
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce").fillna(0)
    df = df.dropna(subset=[time_col, hue_col])
    df[hue_col] = df[hue_col].astype(str).str.strip()
    df[time_col] = df[time_col].dt.to_period("M").dt.to_timestamp()

    # Names come from each hue value's own rows, before the aliases are merged,
    # so a merged line keeps the canonical company's name (or its code).
    names = {}
    if name_col and name_col in df.columns:
        names = (df.dropna(subset=[name_col])
                   .groupby(hue_col)[name_col]
                   .agg(lambda s: s.astype(str).str.strip().mode().iat[0]))
    if aliases:
        df[hue_col] = df[hue_col].replace(aliases)

    # Monthly totals per company, on a complete month grid so that months with
    # no activity keep the cumulative line flat instead of breaking it.
    monthly = df.pivot_table(index=time_col, columns=hue_col, values=value_col,
                             aggfunc="sum", fill_value=0)
    full_idx = pd.date_range(monthly.index.min(), monthly.index.max(), freq="MS")
    monthly = monthly.reindex(full_idx, fill_value=0)
    cumsum = monthly.cumsum()
    if start:
        cumsum = cumsum[cumsum.index >= pd.Timestamp(start)]

    # Keep the companies with the largest final total (a race with dozens of
    # lines is unreadable).
    ranking = cumsum.iloc[-1].sort_values(ascending=False)
    if top_n > 0:
        cumsum = cumsum[ranking.index[:top_n]]

    labels = {}
    for c in cumsum.columns:
        name = names.get(c) if name_col else c
        if name and len(name) <= max_label_len:
            labels[c] = name
        elif name_col:
            short = short_name(name, max_label_len) if (name and shorten_names) else ""
            labels[c] = short if short and not short.endswith("\u2026") else str(c)
        else:
            labels[c] = short_name(str(c), max_label_len)

    long = cumsum.rename(columns=labels).stack().reset_index()
    long.columns = ["mes", "empresa", value_name]
    long["mes"] = long["mes"].dt.strftime("%Y-%m")
    # Before a company's first record there is nothing to plot (and 0 has no
    # place on the chart's log axis): null, not dropped, so every line has the
    # same months and the race animation stays in sync.
    long[value_name] = long[value_name].round(1).astype(object)
    long.loc[long[value_name] <= 0, value_name] = None
    return long, ranking


def write_json(long, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    rows = [list(long.columns)] + long.values.tolist()
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Saved {len(rows) - 1:,} points "
          f"({long.iloc[:, 1].nunique()} lines, {long.iloc[:, 0].nunique()} months) to {out_path}")
    print(f"\nLine labels: {list(long.iloc[:, 1].unique())}")
    return rows
