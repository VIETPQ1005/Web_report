#!/usr/bin/env python3
r"""
Unified ETL Pipeline: Read all .xlsx files in D:\Project_AI\Website\data,
auto-detect Sales vs. Inventory datasets, strip PII / summary footers, and build
compact row-level JSON + JS for the CYBERPULSE Sales & Inventory Command Dashboard.
Zero external Python dependencies (uses stdlib zipfile + xml.etree.ElementTree).
"""

import argparse
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
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
    try:
        num = float(s)
        if 30000 <= num <= 70000:
            return datetime.date(1899, 12, 30) + datetime.timedelta(days=int(num))
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d", "%d.%m.%y", "%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def parse_float(val) -> float:
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip().replace(",", "")
    if not s:
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def read_xlsx_rows(xlsx_path: Path) -> tuple[list[str], list[dict[str, str | None]]]:
    records: list[dict[str, str | None]] = []
    detected_headers: list[str] = []
    with zipfile.ZipFile(xlsx_path, "r") as z:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss_root.findall("main:si", NS):
                text = "".join(t.text or "" for t in si.findall(".//main:t", NS))
                shared_strings.append(text)

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
            if not detected_headers:
                detected_headers = headers
            for r in raw_rows[1:]:
                if not r:
                    continue
                first_cell = str(r[0] or "").strip()
                first_lower = first_cell.lower()
                if not first_cell or first_lower == "total" or first_lower.startswith("applied filters"):
                    continue
                rec = {}
                for i, h in enumerate(headers):
                    if h:
                        rec[h] = r[i] if i < len(r) else None
                records.append(rec)
    return detected_headers, records


def detect_dataset_kind(headers: list[str], filename: str) -> str:
    lower_set = {h.strip().lower() for h in headers if h}
    if "inventory qty" in lower_set or "bin type" in lower_set or "bin code" in lower_set:
        return "inventory"
    if "report date" in lower_set or "sales qty" in lower_set:
        return "sales"
    fname = filename.lower()
    if "inv" in fname or "stock" in fname or "ton" in fname:
        return "inventory"
    return "sales"


def clean_subcat(val: str) -> str:
    s = (val or "").strip()
    if not s:
        return "Khác"
    m = re.match(r"^NH\d+(?:-\d+)+-(.+)$", s)
    return m.group(1).strip() if m else s


def build_sales_section(all_raw: list[dict], source_meta: list[dict]) -> dict:
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

        qty = int(round(parse_float(rec.get("Sales QTY"))))
        sales = round(parse_float(rec.get("Sales")), 2)
        cogs = round(parse_float(rec.get("COGS")), 2)
        gp = round(parse_float(rec.get("GP")), 2)

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

    compact_rows.sort(key=lambda x: x[0])

    return {
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
                "qty", "sales", "cogs", "gp",
            ],
        },
        "lookups": lookups,
        "siteDirectory": site_directory,
        "rows": compact_rows,
    }


def build_inventory_section(all_raw: list[dict], source_meta: list[dict]) -> dict | None:
    if not all_raw:
        return None

    lookups = {
        "sites": [],
        "siteNames": [],
        "subcats": [],
        "brands": [],
        "binCodes": [],
        "binTypes": [],
        "binZones": [],
        "purchaseStatuses": [],
        "skus": [],
    }
    lookup_maps = {k: {} for k in lookups}

    def get_idx(key: str, val: str) -> int:
        m = lookup_maps[key]
        if val not in m:
            m[val] = len(lookups[key])
            lookups[key].append(val)
        return m[val]

    # Determine snapshot date from latest Last Received Date (fallback: today)
    parsed_dates = []
    for rec in all_raw:
        ld = parse_excel_date(rec.get("Last Received Date"))
        if ld is not None:
            parsed_dates.append(ld)
    snapshot_date = max(parsed_dates) if parsed_dates else datetime.date.today()

    compact_rows = []
    site_directory = {}
    tot_qty = 0
    tot_value = 0.0
    tot_net_value = 0.0
    tot_pp_done = 0.0
    tot_pp_proc = 0.0
    sellable_qty = 0
    sellable_val = 0.0
    damaged_qty = 0
    damaged_val = 0.0
    disc_qty = 0
    disc_val = 0.0
    unique_skus = set()

    for rec in all_raw:
        sku_code = str(rec.get("SKU") or "").strip()
        if not sku_code:
            continue
        sku_name = str(rec.get("SKU Name") or "").strip()
        sku_label = f"{sku_code} — {sku_name}" if sku_name else sku_code
        unique_skus.add(sku_code)

        site = str(rec.get("Site Code") or "UNKNOWN").strip()
        site_name = str(rec.get("Site Name") or "").strip() or site
        subcat = clean_subcat(rec.get("Subcat 2 (Code - Name)") or "")
        brand = str(rec.get("Brand Name") or "Khác").strip()
        bin_code = str(rec.get("BIN Code") or "N/A").strip()
        bin_type = str(rec.get("BIN Type") or "Khác").strip()
        bin_zone = str(rec.get("BIN Zone") or "Khác").strip()
        purchase_status = str(rec.get("Purchase status") or "Normal").strip()

        last_recv_d = parse_excel_date(rec.get("Last Received Date"))
        first_recv_d = parse_excel_date(rec.get("First Received Date"))
        last_recv_iso = last_recv_d.strftime("%Y-%m-%d") if last_recv_d else ""
        first_recv_iso = first_recv_d.strftime("%Y-%m-%d") if first_recv_d else ""
        aging_days = (snapshot_date - last_recv_d).days if last_recv_d else -1
        if aging_days < 0 and last_recv_d is not None:
            aging_days = 0

        qty = int(round(parse_float(rec.get("Inventory QTY"))))
        inv_val = round(parse_float(rec.get("Inventory")), 2)
        net_val = round(parse_float(rec.get("Included Price Protection & SO SI No Condition")), 2)
        if net_val == 0.0 and inv_val != 0.0:
            net_val = inv_val
        unit_cost = round(parse_float(rec.get("Unit Cost")), 2)
        if unit_cost == 0.0 and qty > 0 and inv_val > 0:
            unit_cost = round(inv_val / qty, 2)
        listed_price = round(parse_float(rec.get("Listed price")), 2)
        min_stock = int(round(parse_float(rec.get("Min stock"))))
        pp_done = round(parse_float(rec.get("Price Protection & SO SI No Condition Completed")), 2)
        pp_proc = round(parse_float(rec.get("Price Protection & SO SI No Condition in Process")), 2)

        tot_qty += qty
        tot_value += inv_val
        tot_net_value += net_val
        tot_pp_done += pp_done
        tot_pp_proc += pp_proc

        bt_low = bin_type.lower()
        if "bán mới" in bt_low:
            sellable_qty += qty
            sellable_val += inv_val
        if "hư hỏng" in bt_low:
            damaged_qty += qty
            damaged_val += inv_val
        if purchase_status.lower() == "discontinued":
            disc_qty += qty
            disc_val += inv_val

        if site not in site_directory:
            site_directory[site] = {
                "siteCode": site,
                "siteName": site_name,
            }

        compact_rows.append([
            get_idx("skus", sku_label),
            get_idx("sites", site),
            get_idx("siteNames", site_name),
            get_idx("subcats", subcat),
            get_idx("brands", brand),
            get_idx("binCodes", bin_code),
            get_idx("binTypes", bin_type),
            get_idx("binZones", bin_zone),
            get_idx("purchaseStatuses", purchase_status),
            last_recv_iso,
            first_recv_iso,
            aging_days,
            qty,
            inv_val,
            net_val,
            unit_cost,
            listed_price,
            min_stock,
        ])

    # Sort descending by inventory value
    compact_rows.sort(key=lambda x: -x[13])

    return {
        "meta": {
            "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
            "snapshotDate": snapshot_date.strftime("%Y-%m-%d"),
            "sources": source_meta,
            "rowCount": len(compact_rows),
            "uniqueSkuCount": len(unique_skus),
            "totals": {
                "qty": tot_qty,
                "value": round(tot_value, 2),
                "netValue": round(tot_net_value, 2),
                "avgUnitCost": round(tot_value / tot_qty, 2) if tot_qty else 0.0,
                "priceProtectionCompleted": round(tot_pp_done, 2),
                "priceProtectionInProcess": round(tot_pp_proc, 2),
                "sellableQty": sellable_qty,
                "sellableValue": round(sellable_val, 2),
                "damagedQty": damaged_qty,
                "damagedValue": round(damaged_val, 2),
                "discontinuedQty": disc_qty,
                "discontinuedValue": round(disc_val, 2),
            },
            "columns": [
                "skuIdx", "siteIdx", "siteNameIdx", "subcatIdx", "brandIdx",
                "binCodeIdx", "binTypeIdx", "binZoneIdx", "purchaseStatusIdx",
                "lastReceivedDate", "firstReceivedDate", "agingDays",
                "qty", "value", "netValue", "unitCost", "listedPrice", "minStock",
            ],
        },
        "lookups": lookups,
        "siteDirectory": site_directory,
        "rows": compact_rows,
    }


def build():
    xlsx_files = sorted(
        [p for p in DATA_DIR.glob("*.xlsx") if not p.name.startswith("~$")]
    )
    if not xlsx_files:
        print(f"ERROR: No .xlsx files found in {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    sales_raw = []
    sales_sources = []
    inv_raw = []
    inv_sources = []

    for f in xlsx_files:
        headers, recs = read_xlsx_rows(f)
        kind = detect_dataset_kind(headers, f.name)
        meta_entry = {
            "file": f.name,
            "sizeBytes": f.stat().st_size,
            "rows": len(recs),
            "kind": kind,
        }
        if kind == "inventory":
            inv_raw.extend(recs)
            inv_sources.append(meta_entry)
        else:
            sales_raw.extend(recs)
            sales_sources.append(meta_entry)

    payload = build_sales_section(sales_raw, sales_sources)
    inv_section = build_inventory_section(inv_raw, inv_sources)
    if inv_section is not None:
        payload["inventory"] = inv_section

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
    st = payload["meta"]["totals"]
    print(
        f"[SALES]     Rows: {payload['meta']['rowCount']:,} | Range: {payload['meta']['dateMin']} -> {payload['meta']['dateMax']} | "
        f"Sales: {st['sales']:,.2f} VND | Qty: {st['qty']:,} | GP: {st['gp']:,.2f} VND ({st['gmPct']}%)"
    )
    if inv_section is not None:
        it = inv_section["meta"]["totals"]
        print(
            f"[INVENTORY] Rows: {inv_section['meta']['rowCount']:,} | SKUs: {inv_section['meta']['uniqueSkuCount']:,} | "
            f"Sites: {len(inv_section['lookups']['sites'])} | Snapshot: {inv_section['meta']['snapshotDate']} | "
            f"Qty: {it['qty']:,} | Value: {it['value']:,.2f} VND | Net: {it['netValue']:,.2f} VND | "
            f"Sellable: {it['sellableValue']:,.0f} ({it['sellableQty']} qty) | Damaged: {it['damagedValue']:,.0f} ({it['damagedQty']} qty)"
        )
    return json_str


def push_live(site_url: str, json_str: str, update_key: str = ""):
    endpoint = site_url.rstrip("/") + "/api/report-data"
    headers = {"Content-Type": "application/json; charset=utf-8"}
    if update_key:
        headers["x-update-key"] = update_key
    req = urllib.request.Request(endpoint, data=json_str.encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            print(f"[CLOUD LIVE] HTTP {resp.status} -> {endpoint} | {body}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"[CLOUD LIVE ERROR] HTTP {e.code} -> {err_body}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[CLOUD LIVE ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build unified Sales + Inventory JSON from data/*.xlsx")
    parser.add_argument("--push-url", default="", help="Optional Netlify site URL to push live immediately (e.g. https://web-report-47sq.netlify.app)")
    parser.add_argument("--key", default=os.environ.get("UPDATE_DATA_KEY", ""), help="Optional UPDATE_DATA_KEY passcode")
    args = parser.parse_args()
    data_str = build()
    if args.push_url:
        push_live(args.push_url, data_str, args.key)
