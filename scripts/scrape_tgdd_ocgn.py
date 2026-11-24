#!/usr/bin/env python3
"""
Multi-Competitor Price Scraper for Phong Vũ Subcat 2: NH11-01-07-Ổ cứng gắn ngoài.
Currently scrapes:
  1. Thế Giới Di Động (TGDD) — https://www.thegioididong.com/o-cung-di-dong
  2. CellphoneS (CPS)        — https://cellphones.com.vn/phu-kien/o-cung-di-dong.html (GraphQL cate 750)

Outputs multi-competitor matrix JSON: public/data/price_compare_ocgn.json
"""

import datetime
import json
import re
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
OUT_FILE = BASE_DIR / "public" / "data" / "price_compare_ocgn.json"
LOOKUP_MASTER = BASE_DIR / "public" / "data" / "lookup_master.json"
REPORT_DATA = BASE_DIR / "public" / "data" / "report_data.json"

TGDD_BASE = "https://www.thegioididong.com"
TGDD_URL = f"{TGDD_BASE}/o-cung-di-dong"
CPS_URL = "https://cellphones.com.vn/phu-kien/o-cung-di-dong.html"
CPS_GQL_URL = "https://api.cellphones.com.vn/v2/graphql/query"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
}

CAP_RE = re.compile(r"\b(\d+(?:\.\d+)?)\s*(TB|GB)\b", re.I)

# Known model signature tokens (normalized lowercase)
MODEL_PATTERNS = [
    ("xs2000", [r"xs2000", r"sxs2000"]),
    ("xs1000", [r"xs1000", r"sxs1000"]),
    ("e10", [r"\be10\b", r"sdssde10"]),
    ("e30_fortnite", [r"sdssde30f", r"fortnite"]),
    ("e30_std", [r"\be30\b(?!.*fortnite)", r"sdssde30(?!f)"]),
    ("e61", [r"\be61\b", r"sdssde61", r"extreme\s+(?:v2|portable)(?!.*pro)"]),
    ("e81", [r"\be81\b", r"sdssde81", r"extreme\s+pro"]),
    ("creator_magsafe", [r"sdssde62", r"creator\s+phone", r"magsafe"]),
    ("one_touch", [r"one\s*touch", r"\bstky\d+", r"\bstkb\d+", r"\bstkg\d+"]),
    ("expansion", [r"expansion", r"\bstkm\d+", r"\bstkp\d+"]),
    ("ultra_touch", [r"ultra\s*touch", r"\bstma\d+"]),
    ("my_passport_ssd", [r"my\s*passport.*ssd", r"ssd.*my\s*passport"]),
    ("my_passport_ultra", [r"my\s*passport\s+ultra"]),
    ("my_passport", [r"my\s*passport(?!\s*(?:ultra|ssd))"]),
    ("elements_se", [r"elements\s+se"]),
    ("elements", [r"\belements\b(?!\s+se)"]),
    ("t7_shield", [r"\bt7\s*shield\b"]),
    ("t7_touch", [r"\bt7\s*touch\b"]),
    ("t7_std", [r"\bt7\b(?!\s*(?:shield|touch))"]),
    ("t9", [r"\bt9\b"]),
    ("t5_evo", [r"\bt5\s*evo\b"]),
    ("exceria_plus_g2", [r"exceria\s*plus\s*g2", r"lxd20"]),
    ("exceria_plus_g1", [r"exceria\s*plus(?!\s*g2)", r"lxd10"]),
    ("ahv320", [r"ahv320", r"hv320"]),
    ("hd710", [r"hd710", r"ahd710"]),
    ("sc750", [r"sc750"]),
    ("sd810", [r"sd810"]),
    ("se880", [r"se880"]),
    ("rapids_pro", [r"rapids\s*pro"]),
    ("esd310", [r"esd310"]),
    ("esd320", [r"esd320"]),
    ("esd360", [r"esd360"]),
    ("esd370", [r"esd370"]),
    ("esd380", [r"esd380"]),
    ("esd410", [r"esd410"]),
    ("sj25m3", [r"25m3"]),
    ("sj25h3", [r"25h3"]),
    ("sj25a3", [r"25a3"]),
    ("sj25c3", [r"25c3"]),
    ("crucial_x6", [r"\bx6\b"]),
    ("crucial_x8", [r"\bx8\b"]),
    ("crucial_x9_pro", [r"\bx9\s*pro\b"]),
    ("crucial_x9", [r"\bx9\b(?!\s*pro)"]),
    ("crucial_x10_pro", [r"\bx10\s*pro\b"]),
    ("lexar_sl200", [r"sl200"]),
    ("lexar_sl500", [r"sl500"]),
    ("lexar_sl600", [r"sl600"]),
    ("lexar_armor700", [r"armor\s*700"]),
    ("lacie_rugged_mini", [r"rugged\s*mini"]),
    ("lacie_rugged", [r"\brugged\b(?!\s*mini)"]),
    ("canvio_basics", [r"canvio\s*basics"]),
    ("canvio_advance", [r"canvio\s*advance"]),
    ("canvio_ready", [r"canvio\s*ready"]),
]

COLOR_MAP = {
    "đen": "den", "black": "den",
    "bạc": "bac", "silver": "bac",
    "xám": "xam", "grey": "xam", "gray": "xam",
    "xanh": "xanh", "blue": "xanh",
    "đỏ": "do", "red": "do",
    "trắng": "trang", "white": "trang",
}


def fetch_url(url: str, data: bytes = None, extra_headers: dict = None) -> str:
    hdrs = dict(HEADERS)
    if extra_headers:
        hdrs.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=hdrs)
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def extract_next_f_text(html_str: str) -> str:
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html_str, re.S)
    parts = []
    for ch in chunks:
        try:
            parts.append(json.loads('"' + ch + '"'))
        except Exception:
            pass
    return "".join(parts)


def extract_tgdd_products_from_next_f(joined: str) -> list:
    decoder = json.JSONDecoder()
    products = []
    seen = set()
    for m in re.finditer(r'"productPrices":\[', joined):
        obj = None
        search_pos = m.start()
        for _ in range(12):
            cand = joined.rfind("{", max(0, m.start() - 1500), search_pos)
            if cand == -1:
                break
            try:
                parsed, _end = decoder.raw_decode(joined, cand)
                if isinstance(parsed, dict) and "productPrices" in parsed and "url" in parsed and "name" in parsed:
                    obj = parsed
                    break
            except Exception:
                pass
            search_pos = cand
        if not obj:
            continue
        url_rel = str(obj.get("url") or "").strip().lstrip("/")
        if not url_rel.startswith("o-cung-di-dong/"):
            continue
        code = str(obj.get("productCode") or url_rel)
        if code in seen:
            continue
        seen.add(code)

        prices = obj.get("productPrices") or []
        p0 = prices[0] if prices and isinstance(prices[0], dict) else {}
        price = int(round(float(p0.get("price") or 0)))
        sys_price = int(round(float(p0.get("sysPrice") or 0)))
        disc_pct = int(round(float(p0.get("discountPercent") or 0)))
        if disc_pct <= 0 and sys_price > price > 0:
            disc_pct = int(round((sys_price - price) / sys_price * 100))
        is_can_buy = bool(p0.get("isCanBuy", True))

        brand_obj = obj.get("brand") or {}
        brand_name = str(brand_obj.get("brandName") or "").strip() if isinstance(brand_obj, dict) else ""

        products.append({
            "compId": "tgdd",
            "compShort": "TGDD",
            "code": code,
            "name": str(obj.get("name") or "").strip(),
            "brand": brand_name,
            "price": price,
            "oldPrice": sys_price if sys_price > price else 0,
            "discountPct": disc_pct,
            "inStock": is_can_buy,
            "sold": str(obj.get("totalSold") or "").strip(),
            "url": f"{TGDD_BASE}/{url_rel}",
        })
    return products


def scrape_tgdd_all() -> list:
    html0 = fetch_url(TGDD_URL)
    all_prods = {}

    def ingest(html_str: str, label: str):
        joined = extract_next_f_text(html_str)
        items = extract_tgdd_products_from_next_f(joined)
        added = 0
        for it in items:
            if it["code"] not in all_prods:
                all_prods[it["code"]] = it
                added += 1
        print(f"  [TGDD {label}] found={len(items)}, new={added}")

    ingest(html0, "main")
    sub_links = sorted(set(re.findall(r'"(/o-cung-di-dong-[a-z0-9-]+)"', html0)))
    for sl in sub_links:
        try:
            ingest(fetch_url(TGDD_BASE + sl), sl)
        except Exception as exc:
            print(f"  [TGDD {sl}] error: {exc}")

    return list(all_prods.values())


def scrape_cps_all() -> list:
    all_prods = {}
    for page in range(1, 5):
        gql = {
            "query": f"""
            query GetProductsByCateId {{
              products(
                filter: {{ static: {{ categories: ["750"], province_id: 30, stock: {{ from: 0 }} }}, dynamic: {{}} }}
                page: {page}
                size: 100
                sort: [{{ view: desc }}]
              ) {{
                general {{ product_id name sku url_path manufacturer }}
                filterable {{ price special_price stock_available_id }}
              }}
            }}
            """
        }
        raw = fetch_url(
            CPS_GQL_URL,
            data=json.dumps(gql).encode("utf-8"),
            extra_headers={
                "Content-Type": "application/json",
                "Origin": "https://cellphones.com.vn",
                "Referer": CPS_URL,
            },
        )
        data = json.loads(raw)
        prods = data.get("data", {}).get("products") or []
        added = 0
        for p in prods:
            g = p.get("general") or {}
            f = p.get("filterable") or {}
            pid = str(g.get("product_id") or g.get("sku") or "")
            name = str(g.get("name") or "").strip()
            url_path = str(g.get("url_path") or "").strip().lstrip("/")
            if not pid or not name or pid in all_prods:
                continue
            sp = int(round(float(f.get("special_price") or 0)))
            rp = int(round(float(f.get("price") or 0)))
            price = sp if sp > 0 else rp
            old_price = rp if (sp > 0 and rp > sp) else 0
            disc_pct = int(round((old_price - price) / old_price * 100)) if old_price > price > 0 else 0
            stock_id = f.get("stock_available_id")
            in_stock = (stock_id == 46)
            if not in_stock or price <= 0:
                continue

            all_prods[pid] = {
                "compId": "cps",
                "compShort": "CPS",
                "code": pid,
                "name": name,
                "brand": str(g.get("manufacturer") or "").strip(),
                "price": price,
                "oldPrice": old_price,
                "discountPct": disc_pct,
                "inStock": in_stock,
                "sold": "",
                "url": f"https://cellphones.com.vn/{url_path}",
            }
            added += 1
        print(f"  [CPS page={page}] returned={len(prods)}, new={added}")
        if len(prods) < 100:
            break
    return list(all_prods.values())


def norm_brand(b: str, name: str = "") -> str:
    s = (b or "").strip().lower()
    nl = (name or "").lower()
    if not s:
        for cand in [
            "seagate", "sandisk", "kingston", "samsung", "kioxia",
            "western digital", "wd", "adata", "transcend", "lacie",
            "crucial", "lexar", "toshiba", "hiksemi", "hyper", "asus", "orico", "ugreen",
        ]:
            if re.search(rf"\b{re.escape(cand)}\b", nl):
                s = cand
                break
    if s in ("western digital", "wd"):
        return "wd"
    return s


def display_brand(b: str, norm: str) -> str:
    if b:
        return b
    pretty = {
        "wd": "WD", "sandisk": "SanDisk", "kingston": "Kingston", "seagate": "Seagate",
        "samsung": "Samsung", "kioxia": "Kioxia", "adata": "ADATA", "transcend": "Transcend",
        "lacie": "LaCie", "crucial": "Crucial", "lexar": "Lexar", "toshiba": "Toshiba",
        "hiksemi": "Hiksemi", "hyper": "Hyper", "asus": "ASUS", "orico": "Orico", "ugreen": "Ugreen",
    }
    return pretty.get(norm, norm.title() if norm else "Khác")


def extract_drive_type(name: str) -> str:
    nl = (name or "").lower()
    if "ssd" in nl:
        return "SSD"
    if "hdd" in nl:
        return "HDD"
    return "UNKNOWN"


def extract_capacity(name: str) -> str:
    m = CAP_RE.search(name or "")
    if not m:
        return ""
    num = float(m.group(1))
    unit = m.group(2).upper()
    num_str = str(int(num)) if num.is_integer() else str(num)
    return f"{num_str}{unit}"


def extract_models(name: str, extra_text: str = "") -> set:
    nl = f"{name or ''} {extra_text or ''}".lower()
    found = set()
    for tag, pats in MODEL_PATTERNS:
        for pat in pats:
            if re.search(pat, nl):
                found.add(tag)
                break
    if "e30_fortnite" in found:
        found.discard("e30_std")
    if "exceria_plus_g2" in found:
        found.discard("exceria_plus_g1")
    if "crucial_x9_pro" in found:
        found.discard("crucial_x9")
    if "my_passport_ultra" in found or "my_passport_ssd" in found:
        found.discard("my_passport")
    if "elements_se" in found:
        found.discard("elements")
    if "lacie_rugged_mini" in found:
        found.discard("lacie_rugged")
    for code in re.findall(
        r"\b(?:st[a-z]{2}\d{6,7}|sdssd[a-z]\d{2}f?|sxs\d{4}[a-z]*|xs\d{4}|lxd\d{2}[a-z0-9]*|mu-[a-z0-9]+|wdb[a-z0-9]+|ahv\d{3}|ts\d+[a-z0-9]+)\b",
        nl,
    ):
        found.add(code)
    return found


def extract_colors(name: str) -> set:
    nl = (name or "").lower()
    cols = set()
    for k, v in COLOR_MAP.items():
        if re.search(rf"(?:^|[\s(/,-]){re.escape(k)}(?:$|[\s)/,-])", nl):
            cols.add(v)
    return cols


def load_pv_ocgn() -> list:
    master = json.loads(LOOKUP_MASTER.read_text(encoding="utf-8"))
    report = json.loads(REPORT_DATA.read_text(encoding="utf-8"))

    mpL = master["lookups"]
    subcats = mpL["subcats"]
    brands = mpL["brands"]
    statuses = mpL["purchaseStatuses"]
    ranges = mpL["ranges"]
    listings = mpL["listings"]
    prices_map = master.get("priceBySku", {})
    sales_by_sku = master.get("salesBySku", {})
    vel_by_sku = {str(r[0]): r for r in report.get("invSkuLevel", {}).get("rows", [])}
    today_iso = datetime.date.today().strftime("%Y-%m-%d")

    pv_list = []
    for r in master["rows"]:
        sku = str(r[0]).strip()
        sc = subcats[r[3]] if r[3] < len(subcats) else ""
        if sc != "NH11-01-07-Ổ cứng gắn ngoài":
            continue
        name = str(r[1] or "").strip()
        brand_raw = brands[r[5]] if r[5] < len(brands) else ""
        status = statuses[r[6]] if r[6] < len(statuses) else ""
        rng = ranges[r[7]] if r[7] < len(ranges) else ""
        listing = listings[r[8]] if r[8] < len(listings) else ""

        pr = prices_map.get(sku)
        cur_p = int(pr[0]) if pr and len(pr) > 0 else 0
        new_p = int(pr[1]) if pr and len(pr) > 1 else 0
        ad_iso = str(pr[2] or "") if pr and len(pr) > 2 else ""
        promo_p = int(pr[3]) if pr and len(pr) > 3 else 0

        is_new_active = new_p > 0 and bool(ad_iso) and ad_iso <= today_iso
        is_new_upcoming = new_p > 0 and bool(ad_iso) and ad_iso > today_iso
        normal_effective = new_p if is_new_active else cur_p
        # Priority 1: New promotion price (if > 0), else Normal effective price
        effective_price = promo_p if promo_p > 0 else normal_effective
        is_promo = promo_p > 0 and (normal_effective == 0 or promo_p != normal_effective)

        vel = vel_by_sku.get(sku)
        s7d = int(vel[6] or 0) if vel else 0
        s30d = int(vel[7] or 0) if vel else 0
        inv_qty = int(vel[12] or 0) if vel else 0
        ytd_sales = round(float(sales_by_sku.get(sku, [0])[0] or 0), 2)

        pv_list.append({
            "sku": sku,
            "name": name,
            "brand": brand_raw,
            "brandNorm": norm_brand(brand_raw, name),
            "driveType": extract_drive_type(name),
            "capacity": extract_capacity(name),
            "models": extract_models(name),
            "colors": extract_colors(name),
            "status": status,
            "range": rng,
            "listing": listing,
            "pvPrice": effective_price,
            "pvNormalPrice": normal_effective,
            "pvPromoPrice": promo_p,
            "pvIsPromo": is_promo,
            "pvNewPrice": new_p if is_new_upcoming else 0,
            "pvActiveDate": ad_iso if (is_new_active or is_new_upcoming) else "",
            "pvPriceState": "new_active" if is_new_active else ("upcoming" if is_new_upcoming else "current"),
            "invQty": inv_qty,
            "s7d": s7d,
            "s30d": s30d,
            "ytdSales": ytd_sales,
        })
    return pv_list


def match_competitor_products(comp_prods: list, pv_priced: list) -> tuple:
    """
    Matches each competitor product to its best PV SKU.
    Returns:
      - matched_by_pv: { pvSku: best_comp_offer_dict } (if multiple color variants on same competitor match same PV SKU, keep the lowest in-stock price!)
      - unmatched_list: list of competitor products that didn't match any PV SKU
    """
    matched_by_pv = {}
    unmatched_list = []

    for cp in comp_prods:
        c_brand = norm_brand(cp["brand"], cp["name"])
        c_type = extract_drive_type(cp["name"])
        c_cap = extract_capacity(cp["name"])
        c_models = extract_models(cp["name"], cp["url"])
        c_colors = extract_colors(cp["name"])
        cp["brand"] = display_brand(cp["brand"], c_brand)
        cp["brandNorm"] = c_brand
        cp["driveType"] = c_type
        cp["capacity"] = c_cap

        candidates = []
        for pv in pv_priced:
            if pv["brandNorm"] != c_brand:
                continue
            if c_cap and pv["capacity"] != c_cap:
                continue
            if c_type != "UNKNOWN" and pv["driveType"] != "UNKNOWN" and pv["driveType"] != c_type:
                continue
            overlap = c_models & pv["models"]
            if not overlap:
                continue

            score = len(overlap) * 100
            for tok in overlap:
                if len(tok) >= 6:
                    score += 60
            if c_colors and pv["colors"]:
                score += 35 if (c_colors & pv["colors"]) else -10
            if pv["invQty"] > 0:
                score += 20
            if pv["listing"].lower() == "active":
                score += 10
            if pv["s30d"] > 0:
                score += 10
            candidates.append((score, pv))

        candidates.sort(key=lambda x: (x[0], x[1]["invQty"], x[1]["s30d"]), reverse=True)
        if candidates:
            best_score, pv = candidates[0]
            sku = pv["sku"]
            prev = matched_by_pv.get(sku)
            # Keep the more competitive (in-stock, then lower price) offer if competitor lists multiple colors
            if prev is None:
                matched_by_pv[sku] = (best_score, cp)
            else:
                prev_score, prev_cp = prev
                better = (cp["inStock"] and not prev_cp["inStock"]) or (
                    cp["inStock"] == prev_cp["inStock"] and (
                        best_score > prev_score + 20 or (abs(best_score - prev_score) <= 20 and 0 < cp["price"] < prev_cp["price"])
                    )
                )
                if better:
                    matched_by_pv[sku] = (best_score, cp)
        else:
            unmatched_list.append({
                "compId": cp["compId"],
                "compShort": cp["compShort"],
                "name": cp["name"],
                "brand": cp["brand"],
                "driveType": c_type,
                "capacity": c_cap,
                "price": cp["price"],
                "oldPrice": cp["oldPrice"],
                "discountPct": cp["discountPct"],
                "inStock": cp["inStock"],
                "sold": cp["sold"],
                "url": cp["url"],
            })

    return {k: v[1] for k, v in matched_by_pv.items()}, unmatched_list


def main():
    print("Scraping multi-competitor portable drive prices (OCGN)...")
    tgdd_prods = scrape_tgdd_all()
    cps_prods = scrape_cps_all()
    print(f"Scraped totals: TGDD={len(tgdd_prods)} | CellphoneS={len(cps_prods)}")

    pv_list = load_pv_ocgn()
    pv_by_sku = {p["sku"]: p for p in pv_list}
    pv_priced = [p for p in pv_list if p["pvPrice"] > 0]
    print(f"PV OCGN SKUs: {len(pv_list)} (priced: {len(pv_priced)})")

    tgdd_matched, tgdd_unmatched = match_competitor_products(tgdd_prods, pv_priced)
    cps_matched, cps_unmatched = match_competitor_products(cps_prods, pv_priced)

    all_matched_skus = sorted(set(tgdd_matched.keys()) | set(cps_matched.keys()))
    matrix_rows = []
    for sku in all_matched_skus:
        pv = pv_by_sku[sku]
        pv_p = pv["pvPrice"]
        comps = {}
        best_id = ""
        best_price = 0
        higher_cnt = 0
        cheaper_cnt = 0
        equal_cnt = 0

        for cid, cmap in (("tgdd", tgdd_matched), ("cps", cps_matched)):
            offer = cmap.get(sku)
            if not offer:
                continue
            cp_p = offer["price"]
            diff = pv_p - cp_p if cp_p > 0 else 0
            diff_pct = round((diff / cp_p) * 100, 1) if cp_p > 0 else 0.0
            if cp_p > 0:
                if abs(diff) <= 10000:
                    equal_cnt += 1
                elif diff > 0:
                    higher_cnt += 1
                else:
                    cheaper_cnt += 1
                if best_price == 0 or cp_p < best_price:
                    best_price = cp_p
                    best_id = cid
            comps[cid] = {
                "name": offer["name"],
                "price": cp_p,
                "oldPrice": offer["oldPrice"],
                "discountPct": offer["discountPct"],
                "inStock": offer["inStock"],
                "sold": offer["sold"],
                "url": offer["url"],
                "diffVnd": diff,
                "diffPct": diff_pct,
            }

        diff_best = pv_p - best_price if best_price > 0 else 0
        diff_best_pct = round((diff_best / best_price) * 100, 1) if best_price > 0 else 0.0
        comp_cnt = len(comps)
        if higher_cnt == comp_cnt and comp_cnt > 0:
            pos = "pv_higher_all"
        elif higher_cnt > 0:
            pos = "pv_higher_some"
        elif cheaper_cnt > 0:
            pos = "pv_cheapest"
        else:
            pos = "pv_equal"

        matrix_rows.append({
            "pvSku": sku,
            "pvName": pv["name"],
            "pvBrand": pv["brand"],
            "driveType": pv["driveType"],
            "capacity": pv["capacity"],
            "pvStatus": pv["status"],
            "pvRange": pv["range"],
            "pvListing": pv["listing"],
            "pvPrice": pv_p,
            "pvNormalPrice": pv["pvNormalPrice"],
            "pvPromoPrice": pv["pvPromoPrice"],
            "pvIsPromo": pv["pvIsPromo"],
            "pvNewPrice": pv["pvNewPrice"],
            "pvActiveDate": pv["pvActiveDate"],
            "pvPriceState": pv["pvPriceState"],
            "pvInvQty": pv["invQty"],
            "pvS7d": pv["s7d"],
            "pvS30d": pv["s30d"],
            "pvYtdSales": pv["ytdSales"],
            "competitors": comps,
            "compCount": comp_cnt,
            "bestCompId": best_id,
            "bestCompPrice": best_price,
            "diffVsBestVnd": diff_best,
            "diffVsBestPct": diff_best_pct,
            "higherCount": higher_cnt,
            "cheaperCount": cheaper_cnt,
            "equalCount": equal_cnt,
            "position": pos,
        })

    # Sort matrix: multi-competitor matches first, then highest PV premium vs market
    matrix_rows.sort(key=lambda r: (r["compCount"], r["diffVsBestVnd"]), reverse=True)
    unmatched_rows = tgdd_unmatched + cps_unmatched
    unmatched_rows.sort(key=lambda r: (0 if r["inStock"] else 1, r["compId"], r["brand"], r["price"]))

    both_cnt = sum(1 for r in matrix_rows if r["compCount"] >= 2)
    print(f"\nMATRIX SUMMARY: {len(matrix_rows)} unique PV SKUs matched (TGDD={len(tgdd_matched)}, CPS={len(cps_matched)}, Both={both_cnt})")
    print(f"  Unmatched competitor items: TGDD={len(tgdd_unmatched)}, CPS={len(cps_unmatched)}")
    for r in matrix_rows[:15]:
        t_str = f"TGDD={r['competitors']['tgdd']['price']:,}" if "tgdd" in r["competitors"] else "TGDD=—"
        c_str = f"CPS={r['competitors']['cps']['price']:,}" if "cps" in r["competitors"] else "CPS=—"
        print(f"  [{r['position']:14s}] {r['pvSku']} {r['pvName'][:36]:36s} | PV={r['pvPrice']:>10,} | {t_str:16s} | {c_str:16s} | vsBest={r['diffVsBestVnd']:+,}")

    payload = {
        "schemaVersion": 2,
        "meta": {
            "scrapedAt": datetime.datetime.now().isoformat(timespec="seconds"),
            "subcat": "NH11-01-07-Ổ cứng gắn ngoài",
            "pvTotalCount": len(pv_list),
            "pvPricedCount": len(pv_priced),
            "matrixCount": len(matrix_rows),
            "bothMatchedCount": both_cnt,
            "competitors": [
                {
                    "id": "tgdd",
                    "name": "Thế Giới Di Động",
                    "short": "TGDD",
                    "url": TGDD_URL,
                    "totalCount": len(tgdd_prods),
                    "matchedCount": len(tgdd_matched),
                    "unmatchedCount": len(tgdd_unmatched),
                },
                {
                    "id": "cps",
                    "name": "CellphoneS",
                    "short": "CPS",
                    "url": CPS_URL,
                    "totalCount": len(cps_prods),
                    "matchedCount": len(cps_matched),
                    "unmatchedCount": len(cps_unmatched),
                },
            ],
        },
        "matrixRows": matrix_rows,
        "unmatchedRows": unmatched_rows,
    }
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Saved {OUT_FILE} ({OUT_FILE.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
