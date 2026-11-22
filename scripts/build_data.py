#!/usr/bin/env python3
r"""
Enterprise Streaming ETL Pipeline for CYBERPULSE BI Command Dashboard.
Streams all 7 .xlsx files in D:\Project_AI\Website\data using stdlib zipfile + xml.etree.ElementTree.iterparse
(handles 84MB+ Excel files with ~500K rows in low RAM, zero external dependencies).

Outputs:
  1. public/data/report_data.json    — Compact Star-Schema Cube for fast initial dashboard load
                                       (Sales monthly/site/region/cat/subcat/brand cube + daily trend cube,
                                        Inventory BIN details, Serial+BadStock cube, SKU Level, Branch Level,
                                        Master Product summary, Category/Subcat2 taxonomy).
  2. public/data/lookup_master.json  — Lazy-loaded full catalog (17,118+ SKUs + YTD Sales per SKU) for 360° Search.
  3. public/data/lookup_serials.json — Lazy-loaded full serial ledger (40,726+ Serials joined with Bad Stock).
"""

import argparse
import datetime
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

NS_URI = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
TAG_ROW = f"{{{NS_URI}}}row"
TAG_C = f"{{{NS_URI}}}c"
TAG_V = f"{{{NS_URI}}}v"
TAG_IS = f"{{{NS_URI}}}is"
TAG_T = f"{{{NS_URI}}}t"
TAG_SI = f"{{{NS_URI}}}si"

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUT_DIR = BASE_DIR / "public" / "data"
OUT_MAIN = OUT_DIR / "report_data.json"
OUT_MASTER = OUT_DIR / "lookup_master.json"
OUT_SERIALS = OUT_DIR / "lookup_serials.json"

CAT_LABELS = {
    "NH11": "Phụ kiện",
    "NH06": "Thiết bị ngoại vi",
    "NH93": "Linh kiện sửa chữa",
    "NH03": "Linh kiện máy tính",
    "NH10": "Giải trí & KTS",
    "NH07": "Thiết bị văn phòng",
}

AGING_LABELS = [
    ("0-30", lambda d: 0 <= d <= 30),
    ("31-60", lambda d: 31 <= d <= 60),
    ("61-90", lambda d: 61 <= d <= 90),
    ("91-180", lambda d: 91 <= d <= 180),
    ("181-365", lambda d: 181 <= d <= 365),
    ("365+", lambda d: d > 365),
    ("unknown", lambda d: d < 0),
]


def aging_bucket_idx(days: int) -> int:
    if days < 0:
        return 6
    if days <= 30:
        return 0
    if days <= 60:
        return 1
    if days <= 90:
        return 2
    if days <= 180:
        return 3
    if days <= 365:
        return 4
    return 5


def col_letters_to_index(col_str: str) -> int:
    idx = 0
    for ch in col_str:
        idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
    return idx - 1


_DATE_CACHE: dict[str, datetime.date | None] = {}
_EXCEL_EPOCH = datetime.date(1899, 12, 30)


def parse_excel_date(raw_val) -> datetime.date | None:
    if raw_val is None:
        return None
    s = str(raw_val).strip()
    if not s:
        return None
    if s in _DATE_CACHE:
        return _DATE_CACHE[s]
    res = None
    try:
        num = float(s)
        if 30000 <= num <= 70000:
            res = _EXCEL_EPOCH + datetime.timedelta(days=int(num))
    except ValueError:
        for fmt in ("%Y-%m-%d", "%d.%m.%y", "%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                res = datetime.datetime.strptime(s, fmt).date()
                break
            except ValueError:
                continue
    if len(_DATE_CACHE) < 50000:
        _DATE_CACHE[s] = res
    return res


def parse_float(val, default: float = 0.0) -> float:
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val) if math.isfinite(float(val)) else default
    s = str(val).strip()
    if not s:
        return default
    if "," in s:
        s = s.replace(",", "")
    if s.lower() in ("inf", "-inf", "nan", "infinity", "#div/0!", "#n/a"):
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


def extract_cat_code(raw_val: str) -> str:
    s = (raw_val or "").strip()
    m = re.match(r"^(NH\d+)", s, re.IGNORECASE)
    return m.group(1).upper() if m else (s.split("-")[0].strip().upper() if s else "KHÁC")


def normalize_subcat2(raw_full: str = "", code: str = "", name: str = "", cat3_code: str = "") -> str:
    s = (raw_full or "").strip()
    if s:
        # Normalize spaces around hyphen if any, preserve "NHxx-xx-xx-Name"
        m = re.match(r"^(NH\d+(?:-\d+)+)\s*-\s*(.+)$", s, re.IGNORECASE)
        if m:
            return f"{m.group(1).upper()}-{m.group(2).strip()}"
        return s
    c = (code or "").strip().upper()
    n = (name or "").strip()
    if not c and cat3_code:
        parts = cat3_code.strip().upper().split("-")
        if len(parts) >= 3:
            c = "-".join(parts[:3])
    if c and n:
        return f"{c}-{n}"
    return c or n or "Khác"


def stream_xlsx_rows(xlsx_path: Path):
    """Generator yielding (headers, row_vals) via streaming XML iterparse."""
    with zipfile.ZipFile(xlsx_path, "r") as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            with z.open("xl/sharedStrings.xml") as f:
                for _, elem in ET.iterparse(f, events=("end",)):
                    if elem.tag == TAG_SI:
                        shared.append("".join(t.text or "" for t in elem.iter(TAG_T)))
                        elem.clear()

        sheets = sorted([n for n in z.namelist() if re.match(r"^xl/worksheets/sheet\d+\.xml$", n)])
        for sf in sheets:
            with z.open(sf) as f:
                headers = None
                for _, elem in ET.iterparse(f, events=("end",)):
                    if elem.tag != TAG_ROW:
                        continue
                    vals = []
                    for c in elem:
                        if c.tag != TAG_C:
                            continue
                        ref = c.attrib.get("r", "")
                        if ref:
                            cs = "".join(ch for ch in ref if ch.isalpha())
                            ci = col_letters_to_index(cs)
                            while len(vals) < ci:
                                vals.append(None)
                        t = c.attrib.get("t", "")
                        val = None
                        if t == "inlineStr":
                            is_el = c.find(TAG_IS)
                            if is_el is not None:
                                val = "".join(x.text or "" for x in is_el.iter(TAG_T))
                        elif t == "s":
                            v_el = c.find(TAG_V)
                            if v_el is not None and v_el.text is not None:
                                idx = int(v_el.text)
                                val = shared[idx] if idx < len(shared) else ""
                        else:
                            v_el = c.find(TAG_V)
                            if v_el is not None:
                                val = v_el.text
                        vals.append(val)
                    elem.clear()
                    if not vals:
                        continue
                    if headers is None:
                        headers = [str(h or "").strip() for h in vals]
                        yield ("__HEADERS__", headers)
                        continue
                    first_cell = str(vals[0] or "").strip()
                    first_low = first_cell.lower()
                    if not first_cell or first_low == "total" or first_low.startswith("applied filters"):
                        continue
                    yield ("__ROW__", vals)


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


def build():
    t_start = time.time()
    xlsx_files = sorted([p for p in DATA_DIR.glob("*.xlsx") if not p.name.startswith("~$")])
    if not xlsx_files:
        print(f"ERROR: No .xlsx files found in {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    # Phase 1: Classify files by peeking header row
    files_by_kind: dict[str, list[Path]] = defaultdict(list)
    for f in xlsx_files:
        for tag, payload in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                kind = detect_dataset_kind(payload, f.name)
                files_by_kind[kind].append(f)
                break

    # ------------------------------------------------------------------
    # 1. MASTER PRODUCT (17,118 SKUs) — Build first so every other file
    #    can enrich Cat Code, Subcat 2, Range, Purchase Status cleanly!
    # ------------------------------------------------------------------
    mp_lookups = {
        "cats": [], "subcats": [], "subcat3s": [], "brands": [],
        "listings": [], "purchaseStatuses": [], "ranges": [], "promoAlerts": [],
    }
    mp_maps = {k: {} for k in mp_lookups}

    def mp_idx(k, v):
        m = mp_maps[k]
        if v not in m:
            m[v] = len(mp_lookups[k])
            mp_lookups[k].append(v)
        return m[v]

    mp_rows = []
    master_map: dict[str, dict] = {}
    mp_sources = []
    mp_summary_agg: dict[tuple, list] = defaultdict(lambda: [0, 0, 0.0])  # (cat, subcat, brand, status, range) -> [skuCnt, invQty, invVal]

    for f in files_by_kind["master_product"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            sku = str(get("sku") or "").strip()
            if not sku:
                continue
            rc += 1
            name = str(get("sku name") or "").strip()
            raw_cat = str(get("category") or "").strip()
            subcat2 = normalize_subcat2(str(get("subcat 2 (code - name)") or ""))
            cat = extract_cat_code(raw_cat or subcat2)
            subcat3 = str(get("subcat 3 (code - name)") or "").strip()
            brand = str(get("brand name") or "Khác").strip()
            listing = str(get("product listing") or "active").strip()
            pstatus = str(get("purchase status") or "Normal").strip()
            rng = str(get("range") or "No").strip() or "No"
            has_sn = 1 if str(get("has serial number") or "").strip().lower() == "yes" else 0
            promo = str(get("promotion alert") or "").strip()
            listed = round(parse_float(get("listed price")), 2)
            sr_promo = round(parse_float(get("sr min promotion price")), 2)
            wcogs = round(parse_float(get("w.cogs no vat")), 2)
            last_pur = round(parse_float(get("last pur price no vat")), 2)
            latest_q = round(parse_float(get("latest quotation")), 2)
            temp_gp = round(parse_float(get("temporary gp")), 2)
            raw_gm = parse_nullable_float(get("temporary gm"))
            temp_gm = round(raw_gm * 100, 2) if raw_gm is not None else None
            inv_qty = int(round(parse_float(get("inv qty"))))
            inv_val = round(parse_float(get("inv")), 2)
            sales_30d = int(round(parse_float(get("30d sales qty"))))
            w_mo = int(round(parse_float(get("warranty period"))))
            w_note = str(get("warranty period note") or "").strip()

            master_map[sku] = {
                "cat": cat, "subcat2": subcat2, "brand": brand,
                "purchaseStatus": pstatus, "range": rng, "name": name,
            }
            c_i, s_i, b_i, st_i, r_i = (
                mp_idx("cats", cat), mp_idx("subcats", subcat2),
                mp_idx("brands", brand), mp_idx("purchaseStatuses", pstatus), mp_idx("ranges", rng),
            )
            agg = mp_summary_agg[(c_i, s_i, st_i, r_i)]
            agg[0] += 1
            agg[1] += inv_qty
            agg[2] += inv_val

            mp_rows.append([
                sku, name, c_i, s_i, mp_idx("subcat3s", subcat3), b_i,
                mp_idx("listings", listing), st_i, r_i, has_sn, mp_idx("promoAlerts", promo),
                listed, sr_promo, wcogs, last_pur, latest_q, temp_gp, temp_gm,
                inv_qty, inv_val, sales_30d, w_mo, w_note,
            ])
        mp_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "master_product"})

    mp_summary_rows = [[k[0], k[1], k[2], k[3], v[0], v[1], round(v[2], 2)] for k, v in mp_summary_agg.items()]
    print(f"[1/6 MASTER]    {len(mp_rows):,} SKUs | summary={len(mp_summary_rows)} rows | cats={mp_lookups['cats']}")

    # ------------------------------------------------------------------
    # 2. SALES (478,301 rows -> Exact Star-Schema Cube + Daily Cube + Per-SKU YTD)
    # ------------------------------------------------------------------
    s_lookups = {
        "cats": [], "subcats": [], "sites": [], "stores": [],
        "regions": [], "channels": [], "brands": [], "orderTypes": [],
    }
    s_maps = {k: {} for k in s_lookups}

    def s_idx(k, v):
        m = s_maps[k]
        if v not in m:
            m[v] = len(s_lookups[k])
            s_lookups[k].append(v)
        return m[v]

    # Monthly Cube key: (month, siteIdx, regionIdx, channelIdx, catIdx, subcatIdx, brandIdx, orderTypeIdx, isBulk)
    # -> [qty, sales, cogs, gp, rowCount]
    monthly_cube: dict[tuple, list] = defaultdict(lambda: [0, 0.0, 0.0, 0.0, 0])
    # Time Drill Cube key: (dateIso, weekStr, monthStr, catIdx, subcatIdx, regionIdx, siteIdx, channelIdx, orderTypeIdx, isBulk)
    # Wait: keep daily cube lean: (dateIso, weekStr, monthStr, catIdx, subcatIdx, regionIdx, channelIdx, orderTypeIdx, isBulk)
    # Actually let's aggregate by (dateIso, weekStr, monthStr, catIdx, subcatIdx, regionIdx, isBulk) -> compact & fast!
    daily_cube: dict[tuple, list] = defaultdict(lambda: [0, 0.0, 0.0, 0.0, 0])
    sku_ytd_sales: dict[str, list] = defaultdict(lambda: [0.0, 0, 0.0, 0])  # sku -> [sales, qty, gp, orders]
    top_sku_sales: dict[tuple, list] = defaultdict(lambda: [0, 0.0, 0.0, 0.0, 0])  # (sku, skuName, catIdx, subcatIdx, brandIdx) -> [qty, sales, cogs, gp, orders]
    site_directory: dict[str, dict] = {}
    sales_sources = []

    tot_sales = 0.0
    tot_qty = 0
    tot_cogs = 0.0
    tot_gp = 0.0
    tot_rows = 0
    min_date = None
    max_date = None
    bulk_count = 0
    bulk_sales = 0.0
    bulk_qty = 0
    all_months_set = set()

    for f in files_by_kind["sales"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            d = parse_excel_date(get("report date"))
            if d is None:
                continue
            rc += 1
            tot_rows += 1
            if min_date is None or d < min_date:
                min_date = d
            if max_date is None or d > max_date:
                max_date = d

            date_iso = d.strftime("%Y-%m-%d")
            month_str = date_iso[:7]
            all_months_set.add(month_str)
            iso_y, iso_w, _ = d.isocalendar()
            week_str = f"{iso_y}-W{iso_w:02d}"

            site = str(get("sales site code") or "UNKNOWN").strip()
            store = str(get("store name") or "").strip() or site
            raw_reg = str(get("region name") or "").strip()
            ch = str(get("sales channel") or "Other").strip()
            reg = raw_reg if raw_reg else f"Non-Store ({ch})"
            raw_cat = str(get("cat name") or "").strip()
            subcat2 = normalize_subcat2(str(get("subcat 2 (code - name)") or ""))
            cat = extract_cat_code(raw_cat or subcat2)
            brand = str(get("brand name") or "Khác").strip()
            otype = str(get("order type") or "don_xuat_ban").strip()
            sku = str(get("sku") or "").strip()

            qty = int(round(parse_float(get("sales qty"))))
            sales = parse_float(get("sales"))
            cogs = parse_float(get("cogs"))
            gp = parse_float(get("gp"))

            tot_sales += sales
            tot_qty += qty
            tot_cogs += cogs
            tot_gp += gp

            is_bulk = 1 if abs(qty) >= 100 else 0
            if is_bulk:
                bulk_count += 1
                bulk_sales += sales
                bulk_qty += qty

            if site not in site_directory:
                site_directory[site] = {
                    "siteCode": site, "storeName": store,
                    "region": reg, "rawRegion": raw_reg, "channel": ch,
                }

            si = s_idx("sites", site)
            ri = s_idx("regions", reg)
            ci = s_idx("channels", ch)
            cati = s_idx("cats", cat)
            subi = s_idx("subcats", subcat2)
            bi = s_idx("brands", brand)
            oi = s_idx("orderTypes", otype)
            s_idx("stores", store)

            mc = monthly_cube[(month_str, si, ri, ci, cati, subi, bi, oi, is_bulk)]
            mc[0] += qty
            mc[1] += sales
            mc[2] += cogs
            mc[3] += gp
            mc[4] += 1

            dc = daily_cube[(date_iso, week_str, month_str, cati, subi, ri, is_bulk)]
            dc[0] += qty
            dc[1] += sales
            dc[2] += cogs
            dc[3] += gp
            dc[4] += 1

            if sku:
                sy = sku_ytd_sales[sku]
                sy[0] += sales
                sy[1] += qty
                sy[2] += gp
                sy[3] += 1

        sales_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "sales"})

    sorted_months = sorted(all_months_set)
    m_map = {m: i for i, m in enumerate(sorted_months)}
    s_lookups["months"] = sorted_months

    cube_rows = [
        [m_map[k[0]], k[1], k[2], k[3], k[4], k[5], k[6], k[7], k[8], v[0], int(round(v[1])), int(round(v[2])), int(round(v[3])), v[4]]
        for k, v in monthly_cube.items()
    ]
    cube_rows.sort(key=lambda x: x[0])

    dates_list = []
    d_map = {}
    weeks_list = []
    w_map = {}
    daily_rows = []
    for k, v in sorted(daily_cube.items(), key=lambda x: x[0][0]):
        dt_s, wk_s, m_s = k[0], k[1], k[2]
        if dt_s not in d_map:
            d_map[dt_s] = len(dates_list)
            dates_list.append(dt_s)
        if wk_s not in w_map:
            w_map[wk_s] = len(weeks_list)
            weeks_list.append(wk_s)
        daily_rows.append([
            d_map[dt_s], w_map[wk_s], m_map[m_s], k[3], k[4], k[5], k[6],
            v[0], int(round(v[1])), int(round(v[2])), int(round(v[3])), v[4]
        ])
    s_lookups["dates"] = dates_list
    s_lookups["weeks"] = weeks_list

    print(
        f"[2/6 SALES]     Raw: {tot_rows:,} -> MonthlyCube: {len(cube_rows):,} | DailyCube: {len(daily_rows):,} | "
        f"Sales: {tot_sales:,.0f} VND | Qty: {tot_qty:,} | Cats: {s_lookups['cats']}"
    )

    # ------------------------------------------------------------------
    # 3. INVENTORY DETAILS (10,396 BIN rows)
    # ------------------------------------------------------------------
    inv_lookups = {
        "cats": [], "sites": [], "siteNames": [], "subcats": [], "brands": [],
        "binCodes": [], "binTypes": [], "binZones": [], "purchaseStatuses": [], "ranges": [], "skus": [],
    }
    inv_maps = {k: {} for k in inv_lookups}

    def inv_idx(k, v):
        m = inv_maps[k]
        if v not in m:
            m[v] = len(inv_lookups[k])
            inv_lookups[k].append(v)
        return m[v]

    inv_raw_list = []
    inv_sources = []
    max_recv_d = None
    for f in files_by_kind["inv_details"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            sku = str(get("sku") or "").strip()
            if not sku:
                continue
            rc += 1
            ld = parse_excel_date(get("last received date"))
            fd = parse_excel_date(get("first received date"))
            if ld and (max_recv_d is None or ld > max_recv_d):
                max_recv_d = ld
            inv_raw_list.append((
                sku, str(get("sku name") or "").strip(), str(get("site code") or "UNKNOWN").strip(),
                str(get("site name") or "").strip(), str(get("subcat 2 (code - name)") or "").strip(),
                str(get("brand name") or "Khác").strip(), str(get("bin code") or "N/A").strip(),
                str(get("bin type") or "Khác").strip(), str(get("bin zone") or "Khác").strip(),
                str(get("purchase status") or "").strip(), str(get("range") or "").strip(),
                ld, fd,
                int(round(parse_float(get("inventory qty")))),
                round(parse_float(get("inventory")), 2),
                round(parse_float(get("included price protection & so si no condition")), 2),
                round(parse_float(get("unit cost")), 2),
                round(parse_float(get("listed price")), 2),
                int(round(parse_float(get("min stock")))),
            ))
        inv_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "inv_details"})

    snapshot_d = max_recv_d or datetime.date.today()
    inv_rows = []
    inv_site_dir = {}
    inv_tot_qty = 0
    inv_tot_val = 0.0
    inv_tot_net = 0.0
    inv_sell_qty = 0
    inv_sell_val = 0.0
    inv_dmg_qty = 0
    inv_dmg_val = 0.0
    inv_disc_qty = 0
    inv_disc_val = 0.0
    inv_skus = set()

    for tup in inv_raw_list:
        (sku, sname, site, site_name, raw_sub, brand, bcode, btype, bzone,
         pstat, rng_raw, ld, fd, qty, val, net_v, ucost, lprice, mstock) = tup
        mp = master_map.get(sku, {})
        subcat2 = normalize_subcat2(raw_sub) if raw_sub else mp.get("subcat2", "Khác")
        cat = extract_cat_code(subcat2) if subcat2 != "Khác" else mp.get("cat", "KHÁC")
        pstatus = pstat or mp.get("purchaseStatus") or "Normal"
        rng = rng_raw or mp.get("range") or "No"
        site_name = site_name or site
        sku_label = f"{sku} — {sname}" if sname else sku
        inv_skus.add(sku)

        if net_v == 0.0 and val != 0.0:
            net_v = val
        if ucost == 0.0 and qty > 0 and val > 0:
            ucost = round(val / qty, 2)

        age_last = max(0, (snapshot_d - ld).days) if ld else -1
        age_first = max(0, (snapshot_d - fd).days) if fd else age_last
        inv_tot_qty += qty
        inv_tot_val += val
        inv_tot_net += net_v
        bt_l = btype.lower()
        if "bán mới" in bt_l:
            inv_sell_qty += qty
            inv_sell_val += val
        if "hư hỏng" in bt_l:
            inv_dmg_qty += qty
            inv_dmg_val += val
        if pstatus.lower() == "discontinued":
            inv_disc_qty += qty
            inv_disc_val += val
        if site not in inv_site_dir:
            inv_site_dir[site] = {"siteCode": site, "siteName": site_name}

        inv_rows.append([
            inv_idx("skus", sku_label),
            inv_idx("sites", site),
            inv_idx("siteNames", site_name),
            inv_idx("subcats", subcat2),
            inv_idx("brands", brand),
            inv_idx("binCodes", bcode),
            inv_idx("binTypes", btype),
            inv_idx("binZones", bzone),
            inv_idx("purchaseStatuses", pstatus),
            ld.strftime("%Y-%m-%d") if ld else "",
            fd.strftime("%Y-%m-%d") if fd else "",
            age_last, qty, val, net_v, ucost, lprice, mstock,
            inv_idx("ranges", rng), age_first, inv_idx("cats", cat),
        ])

    inv_rows.sort(key=lambda x: -x[13])
    print(f"[3/6 INV DET]   {len(inv_rows):,} BIN rows | {inv_tot_qty:,} QTY | {inv_tot_val:,.0f} VND | Cats: {inv_lookups['cats']}")

    # ------------------------------------------------------------------
    # 4. INVENTORY SKU LEVEL (1,380 SKUs) & BRANCH LEVEL (8,747 rows)
    # ------------------------------------------------------------------
    sku_vel_rows = []
    sku_vel_sources = []
    s7t = s30t = s90t = s180t = sqt = 0
    svt = 0.0
    for f in files_by_kind["sku_level"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            sku = str(get("sku") or "").strip()
            if not sku:
                continue
            rc += 1
            mp = master_map.get(sku, {})
            subcat2 = normalize_subcat2(str(get("subcat 2 (code - name)") or "")) or mp.get("subcat2", "Khác")
            cat = extract_cat_code(subcat2) if subcat2 != "Khác" else mp.get("cat", "KHÁC")
            s7 = int(round(parse_float(get("7d sales qty"))))
            s30 = int(round(parse_float(get("30d sales qty"))))
            s90 = int(round(parse_float(get("90d sales qty"))))
            s180 = int(round(parse_float(get("180d sales qty"))))
            raw_gm = parse_nullable_float(get("gm (%)"))
            gm = round(raw_gm * 100, 2) if raw_gm is not None else None
            sdays = parse_nullable_float(get("current s.days"))
            iq = int(round(parse_float(get("inv qty"))))
            iv = round(parse_float(get("inv")), 2)
            uc = round(parse_float(get("unit cost")), 2)
            lp = round(parse_float(get("listed price")), 2)
            pst = str(get("purchase status") or mp.get("purchaseStatus") or "Normal").strip()
            rng = str(mp.get("range") or "No").strip()
            s7t += s7; s30t += s30; s90t += s90; s180t += s180; sqt += iq; svt += iv
            sku_vel_rows.append([
                sku, str(get("sku name") or mp.get("name") or "").strip(),
                subcat2, str(get("brand name") or "Khác").strip(), pst, rng,
                s7, s30, s90, s180, gm, sdays, iq, iv, uc, lp, cat,
            ])
        sku_vel_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "sku_level"})
    sku_vel_rows.sort(key=lambda x: -x[13])

    br_lookups = {"sites": [], "siteNames": []}
    br_maps = {"sites": {}, "siteNames": {}}
    br_rows = []
    br_sources = []
    for f in files_by_kind["branch_level"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            sku = str(get("sku") or "").strip()
            if not sku:
                continue
            rc += 1
            site = str(get("site code") or "UNKNOWN").strip()
            sname = str(get("site name") or "").strip() or site
            if site not in br_maps["sites"]:
                br_maps["sites"][site] = len(br_lookups["sites"])
                br_lookups["sites"].append(site)
            if sname not in br_maps["siteNames"]:
                br_maps["siteNames"][sname] = len(br_lookups["siteNames"])
                br_lookups["siteNames"].append(sname)
            br_rows.append([
                sku, br_maps["sites"][site], br_maps["siteNames"][sname],
                int(round(parse_float(get("7d sales qty")))),
                int(round(parse_float(get("30d sales qty")))),
                int(round(parse_float(get("90d sales qty")))),
                int(round(parse_float(get("180d sales qty")))),
                parse_nullable_float(get("current s.days")),
                int(round(parse_float(get("inv qty")))),
                round(parse_float(get("inv")), 2),
                round(parse_float(get("unit cost")), 2),
            ])
        br_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "branch_level"})
    br_rows.sort(key=lambda x: -x[9])
    print(f"[4/6 SKU+BR]    SKU Level: {len(sku_vel_rows):,} | Branch Level: {len(br_rows):,}")

    # ------------------------------------------------------------------
    # 5. BAD STOCK BY SERIAL (38,621) + INVENTORY SERIAL DETAILS (40,726)
    #    -> Serial Cube in report_data.json + Full Serial list in lookup_serials.json
    # ------------------------------------------------------------------
    bad_by_sn: dict[str, dict] = {}
    bad_sources = []
    for f in files_by_kind["bad_stock"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            sn = str(get("serial number") or "").strip()
            if not sn:
                continue
            rc += 1
            sub2 = normalize_subcat2(code=str(get("subcat 2 code") or ""), name=str(get("subcat 2 name") or ""))
            cat = extract_cat_code(str(get("category code") or sub2))
            dc = parse_excel_date(get("date import company"))
            ds = parse_excel_date(get("date import site"))
            bad_by_sn[sn] = {
                "sku": str(get("sku") or "").strip(),
                "skuName": str(get("sku name") or "").strip(),
                "site": str(get("site code") or "UNKNOWN").strip(),
                "cat": cat, "subcat2": sub2,
                "brand": str(get("brand name") or "Khác").strip(),
                "pstatus": str(get("purchase status") or "Normal").strip(),
                "loc": str(get("location code") or "N/A").strip(),
                "btype": str(get("bin type") or "Hàng bán mới tại kho").strip(),
                "bzone": str(get("bin zone") or "Khác").strip(),
                "dComp": dc.strftime("%Y-%m-%d") if dc else "",
                "aComp": int(round(parse_float(get("aging company"), -1))),
                "sdComp": int(round(parse_float(get("stock day company"), 0))),
                "badComp": str(get("bad stock company") or "Tồn thông thường").strip(),
                "dSite": ds.strftime("%Y-%m-%d") if ds else "",
                "aSite": int(round(parse_float(get("aging site"), -1))),
                "sdSite": int(round(parse_float(get("stock day site"), 0))),
                "badSite": str(get("bad stock site") or "Tồn thông thường").strip(),
                "val": round(parse_float(get("inventory")), 2),
            }
        bad_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "bad_stock"})

    sn_lookups = {
        "cats": [], "sites": [], "subcats": [], "brands": [], "suppliers": [],
        "locations": [], "binTypes": [], "binZones": [], "importTypes": [],
        "purchaseStatuses": [], "ranges": [], "badComp": [], "badSite": [],
    }
    sn_maps = {k: {} for k in sn_lookups}

    def sn_idx(k, v):
        m = sn_maps[k]
        if v not in m:
            m[v] = len(sn_lookups[k])
            sn_lookups[k].append(v)
        return m[v]

    # Aggregated Serial Cube for instant dashboard charts:
    # (catIdx, subcatIdx, siteIdx, binTypeIdx, binZoneIdx, brandIdx, statusIdx, rangeIdx, inBadFile, badCompIdx, badSiteIdx, aCompBucket, aSiteBucket)
    # -> [snCount, invVal]
    serial_cube: dict[tuple, list] = defaultdict(lambda: [0, 0.0])
    full_serial_rows = []
    seen_sn = set()
    sn_sources = []
    sn_tot_val = 0.0
    sn_cls_cnt = 0
    sn_cls_val = 0.0
    sn_risk_cnt = 0
    sn_risk_val = 0.0

    for f in files_by_kind["serial_details"]:
        hmap = {}
        rc = 0
        for tag, vals in stream_xlsx_rows(f):
            if tag == "__HEADERS__":
                hmap = {h.lower(): i for i, h in enumerate(vals) if h}
                continue
            get = lambda k: vals[hmap[k]] if k in hmap and hmap[k] < len(vals) else None
            sn = str(get("serial number") or "").strip()
            if not sn:
                continue
            rc += 1
            seen_sn.add(sn)
            sku = str(get("sku") or "").strip()
            sname = str(get("sku name") or "").strip()
            mp = master_map.get(sku, {})
            bs = bad_by_sn.get(sn)

            cat3 = str(get("category code") or "").strip()
            sub2_name = str(get("subcat 2 name") or "").strip()
            subcat2 = (bs["subcat2"] if bs else "") or mp.get("subcat2") or normalize_subcat2(name=sub2_name, cat3_code=cat3)
            cat = (bs["cat"] if bs else "") or mp.get("cat") or extract_cat_code(cat3 or subcat2)

            site = str(get("site code") or (bs["site"] if bs else "UNKNOWN")).strip()
            brand = str(get("brand name") or mp.get("brand") or "Khác").strip()
            supp = str(get("supplier short name") or "").strip() or "Không rõ NCC"
            loc = str(get("location code") or "N/A").strip()
            btype = str(get("bin type") or (bs["btype"] if bs else "Khác")).strip()
            bzone = str(get("bin zone") or (bs["bzone"] if bs else "Khác")).strip()
            itype = str(get("initial import type") or "").strip() or "Khác"
            pstatus = str((bs["pstatus"] if bs else "") or mp.get("purchaseStatus") or "Normal").strip()
            rng = str(mp.get("range") or "No").strip() or "No"

            fd = parse_excel_date(get("first received date"))
            ld = parse_excel_date(get("last received date"))
            d_first = int(round(parse_float(get("inv days since first received"), -1)))
            d_last = int(round(parse_float(get("inv days since last received"), -1)))
            val = round(parse_float(get("inventory")), 2)
            net_v = round(parse_float(get("included price protection")), 2)
            if net_v == 0.0 and val != 0.0:
                net_v = val
            pp_v = round(parse_float(get("price protection")), 2)

            in_bad = 1 if bs is not None else 0
            a_comp = bs["aComp"] if bs else d_first
            a_site = bs["aSite"] if bs else d_last
            sd_comp = bs["sdComp"] if bs else 0
            sd_site = bs["sdSite"] if bs else 0
            b_comp = bs["badComp"] if bs else f"Không phân loại ({btype})"
            b_site = bs["badSite"] if bs else f"Không phân loại ({btype})"

            sn_tot_val += val
            if bs:
                sn_cls_cnt += 1
                sn_cls_val += val
                if b_comp != "Tồn thông thường":
                    sn_risk_cnt += 1
                    sn_risk_val += val

            c_i = sn_idx("cats", cat)
            sub_i = sn_idx("subcats", subcat2)
            si_i = sn_idx("sites", site)
            bt_i = sn_idx("binTypes", btype)
            bz_i = sn_idx("binZones", bzone)
            br_i = sn_idx("brands", brand)
            ps_i = sn_idx("purchaseStatuses", pstatus)
            rg_i = sn_idx("ranges", rng)
            bc_i = sn_idx("badComp", b_comp)
            bs_i = sn_idx("badSite", b_site)

            ckey = (c_i, sub_i, si_i, bt_i, bz_i, br_i, ps_i, rg_i, in_bad, bc_i, bs_i, aging_bucket_idx(a_comp), aging_bucket_idx(a_site))
            cv = serial_cube[ckey]
            cv[0] += 1
            cv[1] += val

            full_serial_rows.append([
                sn, sku, sname, si_i, sub_i, br_i, sn_idx("suppliers", supp),
                sn_idx("locations", loc), bt_i, bz_i, sn_idx("importTypes", itype),
                ps_i, rg_i,
                fd.strftime("%Y-%m-%d") if fd else "", ld.strftime("%Y-%m-%d") if ld else "",
                d_first, d_last, val, net_v, pp_v, in_bad,
                a_comp, a_site, sd_comp, sd_site, bc_i, bs_i, c_i,
            ])
        sn_sources.append({"file": f.name, "sizeBytes": f.stat().st_size, "rows": rc, "kind": "serial_details"})

    # Add any Bad Stock serials not in Serial Details
    for sn, bs in bad_by_sn.items():
        if sn in seen_sn:
            continue
        mp = master_map.get(bs["sku"], {})
        rng = str(mp.get("range") or "No").strip() or "No"
        val = bs["val"]
        sn_tot_val += val
        sn_cls_cnt += 1
        sn_cls_val += val
        if bs["badComp"] != "Tồn thông thường":
            sn_risk_cnt += 1
            sn_risk_val += val

        c_i = sn_idx("cats", bs["cat"])
        sub_i = sn_idx("subcats", bs["subcat2"])
        si_i = sn_idx("sites", bs["site"])
        bt_i = sn_idx("binTypes", bs["btype"])
        bz_i = sn_idx("binZones", bs["bzone"])
        br_i = sn_idx("brands", bs["brand"])
        ps_i = sn_idx("purchaseStatuses", bs["pstatus"])
        rg_i = sn_idx("ranges", rng)
        bc_i = sn_idx("badComp", bs["badComp"])
        bs_i = sn_idx("badSite", bs["badSite"])

        ckey = (c_i, sub_i, si_i, bt_i, bz_i, br_i, ps_i, rg_i, 1, bc_i, bs_i, aging_bucket_idx(bs["aComp"]), aging_bucket_idx(bs["aSite"]))
        cv = serial_cube[ckey]
        cv[0] += 1
        cv[1] += val

        full_serial_rows.append([
            sn, bs["sku"], bs["skuName"], si_i, sub_i, br_i, sn_idx("suppliers", "Không rõ NCC"),
            sn_idx("locations", bs["loc"]), bt_i, bz_i, sn_idx("importTypes", "Khác"),
            ps_i, rg_i, bs["dComp"], bs["dSite"], bs["aComp"], bs["aSite"],
            val, val, 0.0, 1, bs["aComp"], bs["aSite"], bs["sdComp"], bs["sdSite"], bc_i, bs_i, c_i,
        ])

    serial_cube_rows = [list(k) + [v[0], round(v[1], 2)] for k, v in serial_cube.items()]
    full_serial_rows.sort(key=lambda x: -x[17])
    print(f"[5/6 SERIALS]   Full: {len(full_serial_rows):,} SN -> Cube: {len(serial_cube_rows):,} rows | BadStockRisk: {sn_risk_cnt:,} SN ({sn_risk_val:,.0f} VND)")

    # ------------------------------------------------------------------
    # 6. UNIFIED GLOBAL CATEGORY + SUBCAT2 TAXONOMY
    # ------------------------------------------------------------------
    cat_subcat_map: dict[str, set] = defaultdict(set)
    cat_volume: dict[str, float] = defaultdict(float)

    for row in cube_rows:
        cat = s_lookups["cats"][row[4]]
        sub = s_lookups["subcats"][row[5]]
        cat_subcat_map[cat].add(sub)
        cat_volume[cat] += row[10]
    for row in inv_rows:
        row[13] = int(round(row[13]))
        row[14] = int(round(row[14]))
        row[15] = int(round(row[15]))
        row[16] = int(round(row[16]))
        cat = inv_lookups["cats"][row[20]]
        sub = inv_lookups["subcats"][row[3]]
        cat_subcat_map[cat].add(sub)
        cat_volume[cat] += row[13]
    for row in serial_cube_rows:
        row[14] = int(round(row[14]))
    for row in mp_summary_rows:
        cat = mp_lookups["cats"][row[0]]
        sub = mp_lookups["subcats"][row[1]]
        cat_subcat_map[cat].add(sub)

    sorted_cats = sorted(cat_subcat_map.keys(), key=lambda c: (-cat_volume[c], c))
    taxonomy = {
        "categories": [
            {"code": c, "label": CAT_LABELS.get(c, c), "subcats": sorted(cat_subcat_map[c])}
            for c in sorted_cats
        ],
        "allSubcats": sorted({s for ss in cat_subcat_map.values() for s in ss}),
    }

    # Assemble main report_data.json (fast star-schema bundle)
    now_iso = datetime.datetime.now().isoformat(timespec="seconds")
    main_payload = {
        "schemaVersion": 3,
        "taxonomy": taxonomy,
        "meta": {
            "generatedAt": now_iso,
            "sources": sales_sources,
            "rowCount": tot_rows,
            "cubeRowCount": len(cube_rows),
            "dateMin": min_date.strftime("%Y-%m-%d") if min_date else None,
            "dateMax": max_date.strftime("%Y-%m-%d") if max_date else None,
            "months": sorted(all_months_set),
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
        },
        "lookups": s_lookups,
        "siteDirectory": site_directory,
        "salesCube": cube_rows,
        "salesDaily": daily_rows,
        "inventory": {
            "meta": {
                "generatedAt": now_iso,
                "snapshotDate": snapshot_d.strftime("%Y-%m-%d"),
                "sources": inv_sources,
                "rowCount": len(inv_rows),
                "uniqueSkuCount": len(inv_skus),
                "totals": {
                    "qty": inv_tot_qty,
                    "value": round(inv_tot_val, 2),
                    "netValue": round(inv_tot_net, 2),
                    "avgUnitCost": round(inv_tot_val / inv_tot_qty, 2) if inv_tot_qty else 0.0,
                    "sellableQty": inv_sell_qty,
                    "sellableValue": round(inv_sell_val, 2),
                    "damagedQty": inv_dmg_qty,
                    "damagedValue": round(inv_dmg_val, 2),
                    "discontinuedQty": inv_disc_qty,
                    "discontinuedValue": round(inv_disc_val, 2),
                },
            },
            "lookups": inv_lookups,
            "siteDirectory": inv_site_dir,
            "rows": inv_rows,
        },
        "invSkuLevel": {
            "meta": {
                "sources": sku_vel_sources,
                "rowCount": len(sku_vel_rows),
                "totals": {
                    "sales7d": s7t, "sales30d": s30t, "sales90d": s90t, "sales180d": s180t,
                    "invQty": sqt, "invVal": round(svt, 2),
                },
            },
            "rows": sku_vel_rows,
        },
        "invBranchLevel": {
            "meta": {"sources": br_sources, "rowCount": len(br_rows)},
            "lookups": br_lookups,
            "rows": br_rows,
        },
        "invSerialCube": {
            "meta": {
                "sources": sn_sources + bad_sources,
                "totalSerials": len(full_serial_rows),
                "cubeRows": len(serial_cube_rows),
                "classifiedCount": sn_cls_cnt,
                "classifiedValue": round(sn_cls_val, 2),
                "badRiskCount": sn_risk_cnt,
                "badRiskValue": round(sn_risk_val, 2),
                "totalValue": round(sn_tot_val, 2),
            },
            "lookups": {
                k: sn_lookups[k]
                for k in ("cats", "sites", "subcats", "brands", "binTypes", "binZones", "purchaseStatuses", "ranges", "badComp", "badSite")
            },
            "rows": serial_cube_rows,
        },
        "masterSummary": {
            "meta": {"sources": mp_sources, "rowCount": len(mp_rows)},
            "lookups": {
                k: mp_lookups[k]
                for k in ("cats", "subcats", "purchaseStatuses", "ranges")
            },
            "rows": mp_summary_rows,
        },
    }

    # Lazy Shard 1: Master Product Full + YTD Sales per SKU
    master_shard = {
        "meta": {"generatedAt": now_iso, "rowCount": len(mp_rows), "sources": mp_sources},
        "lookups": mp_lookups,
        "rows": mp_rows,
        "salesBySku": {sku: [round(v[0], 2), v[1], round(v[2], 2), v[3]] for sku, v in sku_ytd_sales.items()},
    }

    # Lazy Shard 2: Full Serial Details + Bad Stock
    serial_shard = {
        "meta": {
            "generatedAt": now_iso, "rowCount": len(full_serial_rows),
            "classifiedCount": sn_cls_cnt, "badRiskCount": sn_risk_cnt,
            "sources": sn_sources + bad_sources,
        },
        "lookups": sn_lookups,
        "rows": full_serial_rows,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    main_str = json.dumps(main_payload, ensure_ascii=False, separators=(",", ":"))
    master_str = json.dumps(master_shard, ensure_ascii=False, separators=(",", ":"))
    serial_str = json.dumps(serial_shard, ensure_ascii=False, separators=(",", ":"))

    OUT_MAIN.write_text(main_str, encoding="utf-8")
    OUT_MASTER.write_text(master_str, encoding="utf-8")
    OUT_SERIALS.write_text(serial_str, encoding="utf-8")

    # Remove legacy report_data.js if oversized so static hosting stays lean
    legacy_js = OUT_DIR / "report_data.js"
    if legacy_js.exists():
        legacy_js.unlink()

    elapsed = time.time() - t_start
    print("=" * 85)
    print(f"[6/6 DONE in {elapsed:.1f}s]")
    print(f"  report_data.json    : {OUT_MAIN.stat().st_size / 1024:,.1f} KB")
    print(f"  lookup_master.json  : {OUT_MASTER.stat().st_size / 1024:,.1f} KB")
    print(f"  lookup_serials.json : {OUT_SERIALS.stat().st_size / 1024:,.1f} KB")
    print(f"  Taxonomy Categories : {[c['code'] for c in taxonomy['categories']]} ({len(taxonomy['allSubcats'])} Subcat 2)")
    return main_str


def push_live(site_url: str, json_str: str, update_key: str = ""):
    endpoint = site_url.rstrip("/") + "/api/report-data"
    headers = {"Content-Type": "application/json; charset=utf-8"}
    if update_key:
        headers["x-update-key"] = update_key
    req = urllib.request.Request(endpoint, data=json_str.encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
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
    parser = argparse.ArgumentParser(description="Build Star-Schema Sales + Inventory + Lazy Lookup Shards from data/*.xlsx")
    parser.add_argument("--push-url", default="", help="Optional Netlify site URL to push report_data.json live")
    parser.add_argument("--key", default=os.environ.get("UPDATE_DATA_KEY", ""), help="Optional UPDATE_DATA_KEY passcode")
    args = parser.parse_args()
    data_str = build()
    if args.push_url:
        push_live(args.push_url, data_str, args.key)
