#!/usr/bin/env python3
r"""
ETL Pipeline: Read all .xlsx files in D:\Project_AI\Website\data and build
compact, zero-PII, row-level JSON for the Cyberpunk Sales Analytics Dashboard.
Zero external Python dependencies (uses stdlib zipfile + xml.etree.ElementTree).
"""

import datetime
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUT_FILE = BASE_DIR / "public" / "data" / "report_data.json"
OUT_JS_FILE = BASE_DIR / "public" / "data" / "report_data.js"


def col_letters_to_index(col_str: str) -> int:
    idx = 0
    for ch in col_str:
        idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
    return idx - 1


def parse_excel_date(raw_val) -> datetime.date | None:
    if raw_val is None:
        return None
    s = str(raw_val).strip()
    if not s:
        return None
    # Excel serial date
    try:
        num = float(s)
        if 30000 <= num <= 70000:
            return datetime.date(1899, 12, 30) + datetime.timedelta(days=int(num))
    except ValueError:
        pass
    # Common string formats
    for fmt in ("%Y-%m-%d", "%d.%m.%y", "%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def read_xlsx_rows(xlsx_path: Path) -> list[dict[str, str | None]]:
    records = []
    with zipfile.ZipFile(xlsx_path, "r") as z:
        # Read shared strings if present
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss_root.findall("main:si", NS):
                text = "".join(t.text or "" for t in si.findall(".//main:t", NS))
                shared_strings.append(text)

        # Find all worksheet XMLs
        sheet_files = sorted(
            [n for n in z.namelist() if re.match(r"^xl/worksheets/sheet\d+\.xml$", n)]
        )
        for sf in sheet_files:
            root = ET.parse(z.open(sf)).getroot()
            raw_rows = []
            for row_el in root.findall(".//main:sheetData/main:row", NS):
                cells = row_el.findall("main:c", NS)
                if not cells:
                    continue
                row_vals: list[str | None] = []
                for c in cells:
                    ref = c.attrib.get("r", "")
                    if ref:
                        col_str = "".join(ch for ch in ref if ch.isalpha())
                        col_idx = col_letters_to_index(col_str)
                        while len(row_vals) < col_idx:
                            row_vals.append(None)
                    t = c.attrib.get("t", "")
                    val = None
                    if t == "inlineStr":
                        is_el = c.find("main:is", NS)
                        if is_el is not None:
                            val = "".join(t_el.text or "" for t_el in is_el.findall(".//main:t", NS))
                    elif t == "s":
                        v_el = c.find("main:v", NS)
                        if v_el is not None and v_el.text is not None:
                            idx = int(v_el.text)
                            val = shared_strings[idx] if idx < len(shared_strings) else ""
                    else:
                        v_el = c.find("main:v", NS)
                        if v_el is not None:
                            val = v_el.text
                    row_vals.append(val)
                raw_rows.append(row_vals)

            if not raw_rows:
                continue

            headers = [str(h or "").strip() for h in raw_rows[0]]
            for r in raw_rows[1:]:
                if not r:
                    continue
                first_cell = str(r[0] or "").strip()
                # Skip Total, blank, or Applied filters footer rows
                if not first_cell or first_cell.lower() == "total" or first_cell.lower().startswith("applied filters"):
                    continue
                rec = {}
                for i, h in enumerate(headers):
                    if h:
                        rec[h] = r[i] if i < len(r) else None
                records.append(rec)
    return records


def clean_subcat(val: str) -> str:
    s = (val or "").strip()
    if not s:
        return "Khác"
    # Strip code prefix like "NH93-01-03-" for cleaner display while preserving name
    m = re.match(r"^NH\d+(?:-\d+)+-(.+)$", s)
    return m.group(1).strip() if m else s


def build():
    xlsx_files = sorted(
        [p for p in DATA_DIR.glob("*.xlsx") if not p.name.startswith("~$")]
    )
    if not xlsx_files:
        print(f"ERROR: No .xlsx files found in {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    all_raw = []
    source_meta = []
    for f in xlsx_files:
        recs = read_xlsx_rows(f)
        all_raw.extend(recs)
        source_meta.append({
            "file": f.name,
            "sizeBytes": f.stat().st_size,
            "rows": len(recs),
        })

    # Lookup tables for compact encoding
    lookups = {
        "sites": [],
        "stores": [],
        "regions": [],
        "channels": [],
        "subcats": [],
        "brands": [],
        "orderTypes": [],
        "skus": [],
    }
    lookup_maps = {k: {} for k in lookups}

    def get_idx(key: str, val: str) -> int:
        m = lookup_maps[key]
        if val not in m:
            m[val] = len(lookups[key])
            lookups[key].append(val)
        return m[val]

    compact_rows = []
    site_directory = {}
    tot_sales = 0.0
    tot_qty = 0
    tot_cogs = 0.0
    tot_gp = 0.0
    min_date = None
    max_date = None
    bulk_count = 0
    bulk_sales = 0.0
    bulk_qty = 0

    for rec in all_raw:
        d = parse_excel_date(rec.get("Report Date"))
        if d is None:
            continue

        if min_date is None or d < min_date:
            min_date = d
        if max_date is None or d > max_date:
            max_date = d

        date_iso = d.strftime("%Y-%m-%d")
        month_str = d.strftime("%Y-%m")
        iso_year, iso_week, _ = d.isocalendar()
        week_str = f"{iso_year}-W{iso_week:02d}"

        site = (rec.get("Sales Site Code") or "UNKNOWN").strip()
        store = (rec.get("Store name") or "").strip() or site
        raw_region = (rec.get("Region name") or "").strip()
        channel = (rec.get("Sales Channel") or "Other").strip()
        region = raw_region if raw_region else f"Non-Store ({channel})"
        subcat = clean_subcat(rec.get("Subcat 2 (Code - Name)") or "")
        brand = (rec.get("Brand Name") or "Khác").strip()
        order_type = (rec.get("Order Type") or "don_xuat_ban").strip()
        sku_code = (rec.get("SKU") or "").strip()
        sku_name = (rec.get("SKU Name") or "").strip()
        sku_label = f"{sku_code} — {sku_name}" if sku_code else sku_name

        qty = int(round(float(rec.get("Sales QTY") or 0)))
        sales = round(float(rec.get("Sales") or 0), 2)
        cogs = round(float(rec.get("COGS") or 0), 2)
        gp = round(float(rec.get("GP") or 0), 2)

        tot_sales += sales
        tot_qty += qty
        tot_cogs += cogs
        tot_gp += gp

        if abs(qty) >= 100:
            bulk_count += 1
            bulk_sales += sales
            bulk_qty += qty

        if site not in site_directory:
            site_directory[site] = {
                "siteCode": site,
                "storeName": store,
                "region": region,
                "rawRegion": raw_region,
                "channel": channel,
            }

        compact_rows.append([
            date_iso,
            month_str,
            week_str,
            get_idx("sites", site),
            get_idx("stores", store),
            get_idx("regions", region),
            get_idx("channels", channel),
            get_idx("subcats", subcat),
            get_idx("brands", brand),
            get_idx("orderTypes", order_type),
            get_idx("skus", sku_label),
            qty,
            sales,
            cogs,
            gp,
        ])

    # Sort rows chronologically
    compact_rows.sort(key=lambda x: x[0])

    payload = {
        "meta": {
            "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
            "sources": source_meta,
            "rowCount": len(compact_rows),
            "dateMin": min_date.strftime("%Y-%m-%d") if min_date else None,
            "dateMax": max_date.strftime("%Y-%m-%d") if max_date else None,
            "totals": {
                "sales": round(tot_sales, 2),
                "qty": tot_qty,
                "cogs": round(tot_cogs, 2),
                "gp": round(tot_gp, 2),
                "gmPct": round((tot_gp / tot_sales * 100), 2) if tot_sales else 0.0,
            },
            "bulkOutliers": {
                "thresholdQty": 100,
                "rowCount": bulk_count,
                "sales": round(bulk_sales, 2),
                "qty": bulk_qty,
            },
            "columns": [
                "date", "month", "week", "siteIdx", "storeIdx", "regionIdx",
                "channelIdx", "subcatIdx", "brandIdx", "orderTypeIdx", "skuIdx",
                "qty", "sales", "cogs", "gp"
            ],
        },
        "lookups": lookups,
        "siteDirectory": site_directory,
        "rows": compact_rows,
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    json_str = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(json_str)
    with open(OUT_JS_FILE, "w", encoding="utf-8") as f:
        f.write("window.REPORT_DATA=")
        f.write(json_str)
        f.write(";")

    out_kb = OUT_FILE.stat().st_size / 1024
    print(f"SUCCESS: Wrote {OUT_FILE} & {OUT_JS_FILE.name} ({out_kb:.1f} KB)")
    print(f"Rows: {len(compact_rows):,} | Date range: {payload['meta']['dateMin']} -> {payload['meta']['dateMax']}")
    print(f"Total Sales: {tot_sales:,.2f} VND | Total Qty: {tot_qty:,} | Total GP: {tot_gp:,.2f} VND | GM: {payload['meta']['totals']['gmPct']}%")
    print(f"Regions ({len(lookups['regions'])}): {lookups['regions']}")
    print(f"Sales Site Codes ({len(lookups['sites'])}): {sorted(lookups['sites'])}")
    print(f"Bulk Outliers (>=100 Qty): {bulk_count} rows, {bulk_qty:,} Qty, {bulk_sales:,.0f} VND")


if __name__ == "__main__":
    build()
