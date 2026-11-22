#!/usr/bin/env python3
r"""
Unified ETL Pipeline: Read all .xlsx files in D:\Project_AI\Website\data,
auto-detect all 7 datasets:
  1. Sale_Revenue_Detail      -> payload (root sales)
  2. Inventory_Details        -> payload.inventory (BIN-level inventory)
  3. Inventory_SKU_Level      -> payload.invSkuLevel (SKU 7D/30D/90D/180D velocity)
  4. Inventory_Branch_Level   -> payload.invBranchLevel (SKU x Site velocity)
  5. Bad Stock by Serial      -> merged into payload.invSerials + payload.badStockMeta
  6. Inventory Serial Details -> payload.invSerials (Serial-level stock + aging + bad stock)
  7. Master Product           -> payload.masterProducts (4,068 SKUs catalog, Range, Purchase status, prices)

Zero external Python dependencies (uses stdlib zipfile + xml.etree.ElementTree).
"""

import argparse
import datetime
import json
import math
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


def parse_float(val, default: float = 0.0) -> float:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val) if math.isfinite(float(val)) else default
    s = str(val).strip().replace(",", "")
    if not s or s.lower() in ("inf", "-inf", "nan", "infinity", "#div/0!", "#n/a"):
        return default
    try:
        n = float(s)
        return n if math.isfinite(n) else default
    except ValueError:
        return default


def parse_nullable_float(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return round(float(val), 2) if math.isfinite(float(val)) else None
    s = str(val).strip().replace(",", "")
    if not s or s.lower() in ("inf", "-inf", "nan", "infinity", "#div/0!", "#n/a"):
        return None
    try:
        n = float(s)
        return round(n, 2) if math.isfinite(n) else None
    except ValueError:
        return None


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
    if "report date" in lower_set:
        return "sales"
    if "bad stock company" in lower_set or "bad stock site" in lower_set or "aging company" in lower_set:
        return "bad_stock"
    if "serial number" in lower_set and (
        "inv days since first received" in lower_set
        or "initial import type" in lower_set
        or "supplier short name" in lower_set
    ):
        return "serial_details"
    if "7d sales qty" in lower_set and "site code" in lower_set:
        return "branch_level"
    if "7d sales qty" in lower_set:
        return "sku_level"
    if (
        "subcat 3 (code - name)" in lower_set
        or "has serial number" in lower_set
        or "warranty period" in lower_set
        or "latest quotation" in lower_set
    ):
        return "master_product"
    if "bin code" in lower_set or "inventory qty" in lower_set:
        return "inv_details"

    fname = filename.lower()
    if "bad" in fname:
        return "bad_stock"
    if "serial" in fname:
        return "serial_details"
    if "branch" in fname:
        return "branch_level"
    if "sku" in fname:
        return "sku_level"
    if "master" in fname:
        return "master_product"
    if "inv" in fname or "stock" in fname:
        return "inv_details"
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


def build_master_products(all_raw: list[dict], source_meta: list[dict]) -> tuple[dict | None, dict[str, dict]]:
    if not all_raw:
        return None, {}

    lookups = {
        "subcats": [],
        "subcat3s": [],
        "brands": [],
        "listings": [],
        "purchaseStatuses": [],
        "ranges": [],
        "promoAlerts": [],
    }
    lookup_maps = {k: {} for k in lookups}

    def get_idx(key: str, val: str) -> int:
        m = lookup_maps[key]
        if val not in m:
            m[val] = len(lookups[key])
            lookups[key].append(val)
        return m[val]

    rows = []
    sku_map: dict[str, dict] = {}
    status_counts: dict[str, int] = {}
    range_counts: dict[str, int] = {}

    for rec in all_raw:
        sku = str(rec.get("SKU") or "").strip()
        if not sku:
            continue
        name = str(rec.get("SKU Name") or "").strip()
        subcat = clean_subcat(rec.get("Subcat 2 (Code - Name)") or "")
        subcat3 = str(rec.get("Subcat 3 (Code - Name)") or "").strip()
        brand = str(rec.get("Brand Name") or "Khác").strip()
        listing = str(rec.get("Product listing") or "active").strip()
        pstatus = str(rec.get("Purchase status") or "Normal").strip()
        rng = str(rec.get("Range") or "No").strip() or "No"
        has_serial = 1 if str(rec.get("Has serial number") or "").strip().lower() == "yes" else 0
        promo = str(rec.get("Promotion Alert") or "").strip()

        listed_price = round(parse_float(rec.get("Listed price")), 2)
        sr_promo = round(parse_float(rec.get("SR min promotion price")), 2)
        wcogs = round(parse_float(rec.get("W.COGS No VAT")), 2)
        last_pur = round(parse_float(rec.get("Last Pur Price No VAT")), 2)
        latest_quote = round(parse_float(rec.get("Latest quotation")), 2)
        temp_gp = round(parse_float(rec.get("Temporary GP")), 2)
        temp_gm = round(parse_float(rec.get("Temporary GM")) * 100, 2) if rec.get("Temporary GM") not in (None, "") else None
        inv_qty = int(round(parse_float(rec.get("Inv QTY"))))
        inv_val = round(parse_float(rec.get("Inv")), 2)
        sales_30d = int(round(parse_float(rec.get("30D Sales QTY"))))
        warranty_mo = int(round(parse_float(rec.get("Warranty period"))))
        warranty_note = str(rec.get("Warranty period note") or "").strip()

        status_counts[pstatus] = status_counts.get(pstatus, 0) + 1
        range_counts[rng] = range_counts.get(rng, 0) + 1

        sku_map[sku] = {
            "sku": sku,
            "name": name,
            "subcat": subcat,
            "brand": brand,
            "listing": listing,
            "purchaseStatus": pstatus,
            "range": rng,
            "listedPrice": listed_price,
            "wcogs": wcogs,
            "warrantyMo": warranty_mo,
        }

        rows.append([
            sku,
            name,
            get_idx("subcats", subcat),
            get_idx("subcat3s", subcat3),
            get_idx("brands", brand),
            get_idx("listings", listing),
            get_idx("purchaseStatuses", pstatus),
            get_idx("ranges", rng),
            has_serial,
            get_idx("promoAlerts", promo),
            listed_price,
            sr_promo,
            wcogs,
            last_pur,
            latest_quote,
            temp_gp,
            temp_gm,
            inv_qty,
            inv_val,
            sales_30d,
            warranty_mo,
            warranty_note,
        ])

    return {
        "meta": {
            "sources": source_meta,
            "rowCount": len(rows),
            "statusCounts": status_counts,
            "rangeCounts": range_counts,
            "columns": [
                "sku", "name", "subcatIdx", "subcat3Idx", "brandIdx",
                "listingIdx", "purchaseStatusIdx", "rangeIdx", "hasSerial", "promoIdx",
                "listedPrice", "srPromo", "wcogs", "lastPur", "latestQuote",
                "tempGp", "tempGmPct", "invQty", "invVal", "sales30d", "warrantyMo", "warrantyNote",
            ],
        },
        "lookups": lookups,
        "rows": rows,
    }, sku_map


def build_inventory_section(
    all_raw: list[dict],
    source_meta: list[dict],
    master_map: dict[str, dict],
) -> dict | None:
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
        "ranges": [],
        "skus": [],
    }
    lookup_maps = {k: {} for k in lookups}

    def get_idx(key: str, val: str) -> int:
        m = lookup_maps[key]
        if val not in m:
            m[val] = len(lookups[key])
            lookups[key].append(val)
        return m[val]

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

        mp = master_map.get(sku_code, {})
        site = str(rec.get("Site Code") or "UNKNOWN").strip()
        site_name = str(rec.get("Site Name") or "").strip() or site
        subcat = clean_subcat(rec.get("Subcat 2 (Code - Name)") or "")
        brand = str(rec.get("Brand Name") or "Khác").strip()
        bin_code = str(rec.get("BIN Code") or "N/A").strip()
        bin_type = str(rec.get("BIN Type") or "Khác").strip()
        bin_zone = str(rec.get("BIN Zone") or "Khác").strip()
        purchase_status = str(rec.get("Purchase status") or mp.get("purchaseStatus") or "Normal").strip()
        rng = str(rec.get("Range") or mp.get("range") or "No").strip() or "No"

        last_recv_d = parse_excel_date(rec.get("Last Received Date"))
        first_recv_d = parse_excel_date(rec.get("First Received Date"))
        last_recv_iso = last_recv_d.strftime("%Y-%m-%d") if last_recv_d else ""
        first_recv_iso = first_recv_d.strftime("%Y-%m-%d") if first_recv_d else ""
        aging_days = (snapshot_date - last_recv_d).days if last_recv_d else -1
        if aging_days < 0 and last_recv_d is not None:
            aging_days = 0
        aging_first_days = (snapshot_date - first_recv_d).days if first_recv_d else aging_days
        if aging_first_days < 0 and first_recv_d is not None:
            aging_first_days = 0

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
            get_idx("ranges", rng),
            aging_first_days,
        ])

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
                "rangeIdx", "agingFirstDays",
            ],
        },
        "lookups": lookups,
        "siteDirectory": site_directory,
        "rows": compact_rows,
    }


def build_sku_level(all_raw: list[dict], source_meta: list[dict], master_map: dict[str, dict]) -> dict | None:
    if not all_raw:
        return None
    rows = []
    tot_7d = tot_30d = tot_90d = tot_180d = tot_inv_qty = 0
    tot_inv_val = 0.0
    for rec in all_raw:
        sku = str(rec.get("SKU") or "").strip()
        if not sku:
            continue
        mp = master_map.get(sku, {})
        s7 = int(round(parse_float(rec.get("7D Sales QTY"))))
        s30 = int(round(parse_float(rec.get("30D Sales QTY"))))
        s90 = int(round(parse_float(rec.get("90D Sales QTY"))))
        s180 = int(round(parse_float(rec.get("180D Sales QTY"))))
        gm = parse_nullable_float(parse_float(rec.get("GM (%)")) * 100) if rec.get("GM (%)") not in (None, "") else None
        sdays = parse_nullable_float(rec.get("Current S.Days"))
        inv_qty = int(round(parse_float(rec.get("Inv QTY"))))
        inv_val = round(parse_float(rec.get("Inv")), 2)
        unit_cost = round(parse_float(rec.get("Unit Cost")), 2)
        listed = round(parse_float(rec.get("Listed price")), 2)
        pstatus = str(rec.get("Purchase status") or mp.get("purchaseStatus") or "Normal").strip()
        rng = str(mp.get("range") or "No").strip()

        tot_7d += s7
        tot_30d += s30
        tot_90d += s90
        tot_180d += s180
        tot_inv_qty += inv_qty
        tot_inv_val += inv_val

        rows.append([
            sku,
            str(rec.get("SKU Name") or mp.get("name") or "").strip(),
            clean_subcat(rec.get("Subcat 2 (Code - Name)") or ""),
            str(rec.get("Brand Name") or "Khác").strip(),
            pstatus,
            rng,
            s7, s30, s90, s180,
            gm, sdays, inv_qty, inv_val, unit_cost, listed,
        ])
    rows.sort(key=lambda x: -x[13])
    return {
        "meta": {
            "sources": source_meta,
            "rowCount": len(rows),
            "totals": {
                "sales7d": tot_7d,
                "sales30d": tot_30d,
                "sales90d": tot_90d,
                "sales180d": tot_180d,
                "invQty": tot_inv_qty,
                "invVal": round(tot_inv_val, 2),
            },
            "columns": [
                "sku", "name", "subcat", "brand", "purchaseStatus", "range",
                "s7d", "s30d", "s90d", "s180d", "gmPct", "sDays", "invQty", "invVal", "unitCost", "listedPrice",
            ],
        },
        "rows": rows,
    }


def build_branch_level(all_raw: list[dict], source_meta: list[dict]) -> dict | None:
    if not all_raw:
        return None
    lookups = {"sites": [], "siteNames": []}
    maps = {"sites": {}, "siteNames": {}}

    def get_idx(key: str, val: str) -> int:
        m = maps[key]
        if val not in m:
            m[val] = len(lookups[key])
            lookups[key].append(val)
        return m[val]

    rows = []
    for rec in all_raw:
        sku = str(rec.get("SKU") or "").strip()
        if not sku:
            continue
        site = str(rec.get("Site Code") or "UNKNOWN").strip()
        site_name = str(rec.get("Site Name") or "").strip() or site
        s7 = int(round(parse_float(rec.get("7D Sales QTY"))))
        s30 = int(round(parse_float(rec.get("30D Sales QTY"))))
        s90 = int(round(parse_float(rec.get("90D Sales QTY"))))
        s180 = int(round(parse_float(rec.get("180D Sales QTY"))))
        sdays = parse_nullable_float(rec.get("Current S.Days"))
        inv_qty = int(round(parse_float(rec.get("Inv QTY"))))
        inv_val = round(parse_float(rec.get("Inv")), 2)
        unit_cost = round(parse_float(rec.get("Unit Cost")), 2)
        rows.append([
            sku,
            get_idx("sites", site),
            get_idx("siteNames", site_name),
            s7, s30, s90, s180,
            sdays, inv_qty, inv_val, unit_cost,
        ])
    rows.sort(key=lambda x: -x[9])
    return {
        "meta": {
            "sources": source_meta,
            "rowCount": len(rows),
            "columns": ["sku", "siteIdx", "siteNameIdx", "s7d", "s30d", "s90d", "s180d", "sDays", "invQty", "invVal", "unitCost"],
        },
        "lookups": lookups,
        "rows": rows,
    }


def build_serials_and_bad_stock(
    serial_raw: list[dict],
    bad_stock_raw: list[dict],
    serial_sources: list[dict],
    bad_stock_sources: list[dict],
    master_map: dict[str, dict],
) -> dict | None:
    if not serial_raw and not bad_stock_raw:
        return None

    # Index Bad Stock by Serial Number
    bad_by_sn: dict[str, dict] = {}
    for rec in bad_stock_raw:
        sn = str(rec.get("Serial Number") or "").strip()
        if not sn:
            continue
        bad_by_sn[sn] = {
            "sku": str(rec.get("SKU") or "").strip(),
            "skuName": str(rec.get("SKU Name") or "").strip(),
            "site": str(rec.get("Site Code") or "UNKNOWN").strip(),
            "siteName": str(rec.get("Site Name") or "").strip(),
            "subcat": str(rec.get("Subcat 2 Name") or "Khác").strip(),
            "brand": str(rec.get("Brand Name") or "Khác").strip(),
            "purchaseStatus": str(rec.get("Purchase status") or "Normal").strip(),
            "loc": str(rec.get("Location Code") or "N/A").strip(),
            "binType": str(rec.get("BIN Type") or "Hàng bán mới tại kho").strip(),
            "binZone": str(rec.get("BIN Zone") or "Khác").strip(),
            "dateComp": (parse_excel_date(rec.get("Date import company")) or None),
            "agingComp": int(round(parse_float(rec.get("Aging company"), -1))),
            "stockDayComp": int(round(parse_float(rec.get("Stock day company"), 0))),
            "badComp": str(rec.get("Bad stock company") or "Tồn thông thường").strip(),
            "dateSite": (parse_excel_date(rec.get("Date import site")) or None),
            "agingSite": int(round(parse_float(rec.get("Aging site"), -1))),
            "stockDaySite": int(round(parse_float(rec.get("Stock day site"), 0))),
            "badSite": str(rec.get("Bad stock site") or "Tồn thông thường").strip(),
            "invVal": round(parse_float(rec.get("Inventory")), 2),
        }

    lookups = {
        "sites": [],
        "subcats": [],
        "brands": [],
        "suppliers": [],
        "locations": [],
        "binTypes": [],
        "binZones": [],
        "importTypes": [],
        "purchaseStatuses": [],
        "ranges": [],
        "badComp": [],
        "badSite": [],
    }
    lookup_maps = {k: {} for k in lookups}

    def get_idx(key: str, val: str) -> int:
        m = lookup_maps[key]
        if val not in m:
            m[val] = len(lookups[key])
            lookups[key].append(val)
        return m[val]

    rows = []
    seen_sn = set()
    tot_val = 0.0
    tot_net = 0.0
    bad_stock_classified_count = 0
    bad_stock_classified_val = 0.0
    bad_stock_risk_count = 0
    bad_stock_risk_val = 0.0

    for rec in serial_raw:
        sn = str(rec.get("Serial Number") or "").strip()
        if not sn:
            continue
        seen_sn.add(sn)
        sku = str(rec.get("SKU") or "").strip()
        sku_name = str(rec.get("SKU Name") or "").strip()
        mp = master_map.get(sku, {})
        bs = bad_by_sn.get(sn)

        site = str(rec.get("Site Code") or (bs["site"] if bs else "UNKNOWN")).strip()
        subcat = str(rec.get("Subcat 2 Name") or mp.get("subcat") or "Khác").strip()
        brand = str(rec.get("Brand Name") or mp.get("brand") or "Khác").strip()
        supplier = str(rec.get("Supplier Short Name") or "").strip() or "Không rõ NCC"
        loc = str(rec.get("Location Code") or "N/A").strip()
        bin_type = str(rec.get("BIN Type") or (bs["binType"] if bs else "Khác")).strip()
        bin_zone = str(rec.get("BIN Zone") or (bs["binZone"] if bs else "Khác")).strip()
        import_type = str(rec.get("Initial import type") or "").strip() or "Khác"
        pstatus = str((bs["purchaseStatus"] if bs else "") or mp.get("purchaseStatus") or "Normal").strip()
        rng = str(mp.get("range") or "No").strip() or "No"

        first_d = parse_excel_date(rec.get("First Received Date"))
        last_d = parse_excel_date(rec.get("Last Received Date"))
        first_iso = first_d.strftime("%Y-%m-%d") if first_d else ""
        last_iso = last_d.strftime("%Y-%m-%d") if last_d else ""

        days_first = int(round(parse_float(rec.get("inv days since first received"), -1)))
        days_last = int(round(parse_float(rec.get("inv days since last received"), -1)))
        inv_val = round(parse_float(rec.get("Inventory")), 2)
        net_val = round(parse_float(rec.get("Included Price Protection")), 2)
        if net_val == 0.0 and inv_val != 0.0:
            net_val = inv_val
        pp_val = round(parse_float(rec.get("Price Protection")), 2)

        in_bad_file = 1 if bs is not None else 0
        aging_comp = bs["agingComp"] if bs else days_first
        aging_site = bs["agingSite"] if bs else days_last
        sday_comp = bs["stockDayComp"] if bs else 0
        sday_site = bs["stockDaySite"] if bs else 0
        bad_comp = bs["badComp"] if bs else f"Không phân loại ({bin_type})"
        bad_site = bs["badSite"] if bs else f"Không phân loại ({bin_type})"

        tot_val += inv_val
        tot_net += net_val
        if bs is not None:
            bad_stock_classified_count += 1
            bad_stock_classified_val += inv_val
            if bad_comp != "Tồn thông thường":
                bad_stock_risk_count += 1
                bad_stock_risk_val += inv_val

        rows.append([
            sn,
            sku,
            sku_name,
            get_idx("sites", site),
            get_idx("subcats", subcat),
            get_idx("brands", brand),
            get_idx("suppliers", supplier),
            get_idx("locations", loc),
            get_idx("binTypes", bin_type),
            get_idx("binZones", bin_zone),
            get_idx("importTypes", import_type),
            get_idx("purchaseStatuses", pstatus),
            get_idx("ranges", rng),
            first_iso,
            last_iso,
            days_first,
            days_last,
            inv_val,
            net_val,
            pp_val,
            in_bad_file,
            aging_comp,
            aging_site,
            sday_comp,
            sday_site,
            get_idx("badComp", bad_comp),
            get_idx("badSite", bad_site),
        ])

    # Include any Bad Stock serials not present in Serial Details
    for sn, bs in bad_by_sn.items():
        if sn in seen_sn:
            continue
        sku = bs["sku"]
        mp = master_map.get(sku, {})
        rng = str(mp.get("range") or "No").strip() or "No"
        inv_val = bs["invVal"]
        tot_val += inv_val
        tot_net += inv_val
        bad_stock_classified_count += 1
        bad_stock_classified_val += inv_val
        if bs["badComp"] != "Tồn thông thường":
            bad_stock_risk_count += 1
            bad_stock_risk_val += inv_val
        rows.append([
            sn,
            sku,
            bs["skuName"],
            get_idx("sites", bs["site"]),
            get_idx("subcats", bs["subcat"]),
            get_idx("brands", bs["brand"]),
            get_idx("suppliers", "Không rõ NCC"),
            get_idx("locations", bs["loc"]),
            get_idx("binTypes", bs["binType"]),
            get_idx("binZones", bs["binZone"]),
            get_idx("importTypes", "Khác"),
            get_idx("purchaseStatuses", bs["purchaseStatus"]),
            get_idx("ranges", rng),
            bs["dateComp"].strftime("%Y-%m-%d") if bs["dateComp"] else "",
            bs["dateSite"].strftime("%Y-%m-%d") if bs["dateSite"] else "",
            bs["agingComp"],
            bs["agingSite"],
            inv_val,
            inv_val,
            0.0,
            1,
            bs["agingComp"],
            bs["agingSite"],
            bs["stockDayComp"],
            bs["stockDaySite"],
            get_idx("badComp", bs["badComp"]),
            get_idx("badSite", bs["badSite"]),
        ])

    rows.sort(key=lambda x: -x[17])

    return {
        "meta": {
            "sources": serial_sources + bad_stock_sources,
            "rowCount": len(rows),
            "classifiedCount": bad_stock_classified_count,
            "classifiedValue": round(bad_stock_classified_val, 2),
            "badRiskCount": bad_stock_risk_count,
            "badRiskValue": round(bad_stock_risk_val, 2),
            "totalValue": round(tot_val, 2),
            "totalNetValue": round(tot_net, 2),
            "columns": [
                "sn", "sku", "skuName", "siteIdx", "subcatIdx", "brandIdx",
                "supplierIdx", "locIdx", "binTypeIdx", "binZoneIdx", "importTypeIdx",
                "purchaseStatusIdx", "rangeIdx", "firstDate", "lastDate",
                "daysFirst", "daysLast", "invVal", "netVal", "ppVal",
                "inBadFile", "agingComp", "agingSite", "sdayComp", "sdaySite",
                "badCompIdx", "badSiteIdx",
            ],
        },
        "lookups": lookups,
        "rows": rows,
    }


def build():
    xlsx_files = sorted(
        [p for p in DATA_DIR.glob("*.xlsx") if not p.name.startswith("~$")]
    )
    if not xlsx_files:
        print(f"ERROR: No .xlsx files found in {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    buckets: dict[str, list[dict]] = {
        "sales": [],
        "inv_details": [],
        "sku_level": [],
        "branch_level": [],
        "bad_stock": [],
        "serial_details": [],
        "master_product": [],
    }
    sources: dict[str, list[dict]] = {k: [] for k in buckets}

    for f in xlsx_files:
        headers, recs = read_xlsx_rows(f)
        kind = detect_dataset_kind(headers, f.name)
        buckets[kind].extend(recs)
        sources[kind].append({
            "file": f.name,
            "sizeBytes": f.stat().st_size,
            "rows": len(recs),
            "kind": kind,
        })

    payload = build_sales_section(buckets["sales"], sources["sales"])
    master_section, master_map = build_master_products(buckets["master_product"], sources["master_product"])
    inv_section = build_inventory_section(buckets["inv_details"], sources["inv_details"], master_map)
    sku_level = build_sku_level(buckets["sku_level"], sources["sku_level"], master_map)
    branch_level = build_branch_level(buckets["branch_level"], sources["branch_level"])
    serials_section = build_serials_and_bad_stock(
        buckets["serial_details"],
        buckets["bad_stock"],
        sources["serial_details"],
        sources["bad_stock"],
        master_map,
    )

    if inv_section is not None:
        payload["inventory"] = inv_section
    if master_section is not None:
        payload["masterProducts"] = master_section
    if sku_level is not None:
        payload["invSkuLevel"] = sku_level
    if branch_level is not None:
        payload["invBranchLevel"] = branch_level
    if serials_section is not None:
        payload["invSerials"] = serials_section

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
    print(f"[SALES]         Rows: {payload['meta']['rowCount']:,} | Sales: {st['sales']:,.2f} VND | Qty: {st['qty']:,}")
    if master_section:
        print(f"[MASTER PROD]   SKUs: {master_section['meta']['rowCount']:,} | Status: {master_section['meta']['statusCounts']} | Range: {master_section['meta']['rangeCounts']}")
    if inv_section:
        it = inv_section["meta"]["totals"]
        print(f"[INV DETAILS]   Rows: {inv_section['meta']['rowCount']:,} | Qty: {it['qty']:,} | Value: {it['value']:,.2f} VND")
    if sku_level:
        print(f"[SKU LEVEL]     SKUs: {sku_level['meta']['rowCount']:,} | 7D/30D/90D/180D: {sku_level['meta']['totals']['sales7d']}/{sku_level['meta']['totals']['sales30d']}/{sku_level['meta']['totals']['sales90d']}/{sku_level['meta']['totals']['sales180d']}")
    if branch_level:
        print(f"[BRANCH LEVEL]  Rows: {branch_level['meta']['rowCount']:,} | Sites: {len(branch_level['lookups']['sites'])}")
    if serials_section:
        sm = serials_section["meta"]
        print(f"[SERIALS+BAD]   Total Serials: {sm['rowCount']:,} ({sm['totalValue']:,.0f} VND) | Bad Stock Classified: {sm['classifiedCount']:,} ({sm['classifiedValue']:,.0f} VND) | Risk (!=Thông thường): {sm['badRiskCount']:,} ({sm['badRiskValue']:,.0f} VND)")
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
    parser = argparse.ArgumentParser(description="Build unified Sales + Inventory + Serial + Master Product JSON from data/*.xlsx")
    parser.add_argument("--push-url", default="", help="Optional Netlify site URL to push live immediately")
    parser.add_argument("--key", default=os.environ.get("UPDATE_DATA_KEY", ""), help="Optional UPDATE_DATA_KEY passcode")
    args = parser.parse_args()
    data_str = build()
    if args.push_url:
        push_live(args.push_url, data_str, args.key)
