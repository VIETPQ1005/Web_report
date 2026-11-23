#!/usr/bin/env python3
"""
Scrape Thế Giới Di Động (thegioididong.com/o-cung-di-dong) portable drive prices
and compare against Phong Vũ Subcat 2: NH11-01-07-Ổ cứng gắn ngoài.

Outputs: public/data/price_compare_ocgn.json
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
    ("e30_fortnite", [r"sdssde30f", r"fortnite"]),
    ("e30_std", [r"\be30\b(?!.*fortnite)", r"sdssde30(?!f)"]),
    ("e61", [r"\be61\b", r"sdssde61", r"extreme\s+portable(?!.*pro)"]),
    ("e81", [r"\be81\b", r"sdssde81", r"extreme\s+pro"]),
    ("one_touch", [r"one\s*touch", r"\bstky\d+", r"\bstkb\d+", r"\bstkg\d+"]),
    ("expansion", [r"expansion", r"\bstkm\d+", r"\bstkp\d+"]),
    ("ultra_touch", [r"ultra\s*touch", r"\bstma\d+"]),
    ("my_passport", [r"my\s*passport"]),
    ("elements", [r"\belements\b"]),
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
    ("esd380", [r"esd380"]),
    ("esd410", [r"esd410"]),
    ("storejet", [r"storejet", r"sj25"]),
]

COLOR_MAP = {
    "đen": "den",
    "black": "den",
    "bạc": "bac",
    "silver": "bac",
    "xám": "xam",
    "grey": "xam",
    "gray": "xam",
    "xanh": "xanh",
    "blue": "xanh",
    "đỏ": "do",
    "red": "do",
    "trắng": "trang",
    "white": "trang",
}


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
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


def extract_products_from_next_f(joined: str) -> list:
    """Find product JSON objects containing 'productPrices' and 'productCode'."""
    decoder = json.JSONDecoder()
    products = []
    seen = set()
    # Find every list array starting right before objects with "productPrices"
    for m in re.finditer(r'"productPrices":\[', joined):
        # Walk backwards to find the opening '{' of this product object
        start = joined.rfind('{"', max(0, m.start() - 1200), m.start())
        if start == -1:
            continue
        # Try expanding backwards if there were nested objects before productPrices
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
        is_can_buy = bool(p0.get("isCanBuy", True))
        stock = p0.get("stock")
        end_date = str(p0.get("endDate") or "")[:10]

        brand_obj = obj.get("brand") or {}
        brand_name = str(brand_obj.get("brandName") or "").strip() if isinstance(brand_obj, dict) else ""

        products.append({
            "code": code,
            "name": str(obj.get("name") or "").strip(),
            "brand": brand_name,
            "price": price,
            "oldPrice": sys_price if sys_price > price else 0,
            "discountPercent": disc_pct,
            "isCanBuy": is_can_buy,
            "stock": stock,
            "promoEndDate": end_date,
            "totalSold": str(obj.get("totalSold") or "").strip(),
            "url": f"{TGDD_BASE}/{url_rel}",
            "avatar": str(obj.get("avatar") or "").strip(),
        })
    return products


def scrape_tgdd_all() -> list:
    html0 = fetch_url(TGDD_URL)
    all_prods = {}

    def ingest(html_str: str, label: str):
        joined = extract_next_f_text(html_str)
        items = extract_products_from_next_f(joined)
        added = 0
        for it in items:
            if it["code"] not in all_prods:
                all_prods[it["code"]] = it
                added += 1
        print(f"  [{label}] found={len(items)}, new={added}")

    ingest(html0, "main")

    # Discover brand & capacity subpages from main page links (skip capacity-only duplicates if needed, include all brand links)
    sub_links = sorted(set(re.findall(r'"(/o-cung-di-dong-[a-z0-9-]+)"', html0)))
    for sl in sub_links:
        try:
            h = fetch_url(TGDD_BASE + sl)
            ingest(h, sl)
        except Exception as exc:
            print(f"  [{sl}] error: {exc}")

    return list(all_prods.values())


def norm_brand(b: str, name: str = "") -> str:
    s = (b or "").strip().lower()
    if not s:
        nl = (name or "").lower()
        for cand in ["seagate", "sandisk", "kingston", "samsung", "kioxia", "wd", "western digital", "adata", "transcend", "lacie", "crucial", "lexar", "toshiba", "hiksemi", "hyper"]:
            if cand in nl:
                s = cand
                break
    if s in ("western digital", "wd"):
        return "wd"
    return s


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
    # Prevent fortnite / g2 from also carrying std / g1 tag
    if "e30_fortnite" in found:
        found.discard("e30_std")
    if "exceria_plus_g2" in found:
        found.discard("exceria_plus_g1")
    # Also extract explicit alphanumeric model codes like STKY1000400, SDSSDE30, SXS1000GA
    for code in re.findall(r"\b(?:st[a-z]{2}\d{6,7}|sdssd[a-z]\d{2}f?|sxs\d{4}[a-z]*|xs\d{4}|lxd\d{2}[a-z0-9]*|mu-[a-z0-9]+|wdb[a-z0-9]+|ahv\d{3})\b", nl):
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
        listed_price = int(round(float(r[9] or 0)))

        pr = prices_map.get(sku)
        cur_p = int(pr[0]) if pr and len(pr) > 0 else 0
        new_p = int(pr[1]) if pr and len(pr) > 1 else 0
        ad_iso = str(pr[2] or "") if pr and len(pr) > 2 else ""

        is_new_active = new_p > 0 and bool(ad_iso) and ad_iso <= today_iso
        is_new_upcoming = new_p > 0 and bool(ad_iso) and ad_iso > today_iso
        effective_price = new_p if is_new_active else cur_p

        vel = vel_by_sku.get(sku)
        s7d = int(vel[6] or 0) if vel else 0
        s30d = int(vel[7] or 0) if vel else 0
        s90d = int(vel[8] or 0) if vel else 0
        s180d = int(vel[9] or 0) if vel else 0
        inv_qty = int(vel[12] or 0) if vel else 0
        inv_val = round(float(vel[13] or 0), 2) if vel else 0.0
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
            "listedPrice": listed_price,
            "pvPrice": effective_price,
            "pvOldPrice": cur_p if is_new_active else 0,
            "pvNewPrice": new_p if is_new_upcoming else 0,
            "pvActiveDate": ad_iso if (is_new_active or is_new_upcoming) else "",
            "pvPriceState": "new_active" if is_new_active else ("upcoming" if is_new_upcoming else "current"),
            "invQty": inv_qty,
            "invVal": inv_val,
            "s7d": s7d,
            "s30d": s30d,
            "s90d": s90d,
            "s180d": s180d,
            "ytdSales": ytd_sales,
        })
    return pv_list


def match_tgdd_to_pv(tgdd_prods: list, pv_list: list) -> tuple:
    # Filter PV candidates to those with a selling price > 0
    pv_priced = [p for p in pv_list if p["pvPrice"] > 0]
    comparisons = []
    matched_pv_skus = set()

    for tg in tgdd_prods:
        t_brand = norm_brand(tg["brand"], tg["name"])
        t_type = extract_drive_type(tg["name"])
        t_cap = extract_capacity(tg["name"])
        t_models = extract_models(tg["name"], tg["url"])
        t_colors = extract_colors(tg["name"])

        tg["brandNorm"] = t_brand
        tg["driveType"] = t_type
        tg["capacity"] = t_cap

        # Score every PV SKU with same brand + same capacity + compatible driveType
        candidates = []
        for pv in pv_priced:
            if pv["brandNorm"] != t_brand:
                continue
            if t_cap and pv["capacity"] != t_cap:
                continue
            if t_type != "UNKNOWN" and pv["driveType"] != "UNKNOWN" and pv["driveType"] != t_type:
                continue

            overlap = t_models & pv["models"]
            if not overlap:
                continue

            score = len(overlap) * 100
            # Bonus for exact model code overlap (longer token like stky1000400 or sdssde30)
            for tok in overlap:
                if len(tok) >= 6:
                    score += 60
            # Bonus for matching color
            if t_colors and pv["colors"]:
                if t_colors & pv["colors"]:
                    score += 35
                else:
                    score -= 10
            # Prefer in-stock & active PV SKUs when multiple variants exist
            if pv["invQty"] > 0:
                score += 20
            if pv["listing"].lower() == "active":
                score += 10
            if pv["s30d"] > 0:
                score += 10

            candidates.append((score, pv, sorted(overlap)))

        candidates.sort(key=lambda x: (x[0], x[1]["invQty"], x[1]["s30d"]), reverse=True)

        if candidates:
            best_score, pv, matched_tokens = candidates[0]
            matched_pv_skus.add(pv["sku"])
            pv_p = pv["pvPrice"]
            tg_p = tg["price"]
            diff = pv_p - tg_p if tg_p > 0 else 0
            diff_pct = round((diff / tg_p) * 100, 1) if tg_p > 0 else 0.0
            if tg_p <= 0:
                cmp_status = "no_tgdd_price"
            elif abs(diff) <= 10000:
                cmp_status = "equal"
            elif diff < 0:
                cmp_status = "pv_cheaper"
            else:
                cmp_status = "pv_higher"

            comparisons.append({
                "tgddCode": tg["code"],
                "tgddName": tg["name"],
                "tgddBrand": tg["brand"] or t_brand.title(),
                "tgddPrice": tg_p,
                "tgddOldPrice": tg["oldPrice"],
                "tgddDiscountPct": tg["discountPercent"],
                "tgddCanBuy": tg["isCanBuy"],
                "tgddSold": tg["totalSold"],
                "tgddUrl": tg["url"],
                "driveType": t_type,
                "capacity": t_cap,
                "pvSku": pv["sku"],
                "pvName": pv["name"],
                "pvBrand": pv["brand"],
                "pvStatus": pv["status"],
                "pvRange": pv["range"],
                "pvListing": pv["listing"],
                "pvPrice": pv_p,
                "pvNewPrice": pv["pvNewPrice"],
                "pvActiveDate": pv["pvActiveDate"],
                "pvPriceState": pv["pvPriceState"],
                "pvInvQty": pv["invQty"],
                "pvS7d": pv["s7d"],
                "pvS30d": pv["s30d"],
                "pvYtdSales": pv["ytdSales"],
                "diffVnd": diff,
                "diffPct": diff_pct,
                "compareStatus": cmp_status,
                "matchTokens": matched_tokens,
                "altPvCount": len(candidates) - 1,
            })
        else:
            comparisons.append({
                "tgddCode": tg["code"],
                "tgddName": tg["name"],
                "tgddBrand": tg["brand"] or t_brand.title(),
                "tgddPrice": tg["price"],
                "tgddOldPrice": tg["oldPrice"],
                "tgddDiscountPct": tg["discountPercent"],
                "tgddCanBuy": tg["isCanBuy"],
                "tgddSold": tg["totalSold"],
                "tgddUrl": tg["url"],
                "driveType": t_type,
                "capacity": t_cap,
                "pvSku": "",
                "pvName": "",
                "pvBrand": "",
                "pvStatus": "",
                "pvRange": "",
                "pvListing": "",
                "pvPrice": 0,
                "pvNewPrice": 0,
                "pvActiveDate": "",
                "pvPriceState": "",
                "pvInvQty": 0,
                "pvS7d": 0,
                "pvS30d": 0,
                "pvYtdSales": 0,
                "diffVnd": 0,
                "diffPct": 0.0,
                "compareStatus": "tgdd_only",
                "matchTokens": [],
                "altPvCount": 0,
            })

    return comparisons, matched_pv_skus


def main():
    print("Scraping Thế Giới Di Động: Ổ cứng di động ...")
    tgdd_prods = scrape_tgdd_all()
    print(f"Total unique TGDD products scraped: {len(tgdd_prods)}")

    pv_list = load_pv_ocgn()
    pv_priced_count = sum(1 for p in pv_list if p["pvPrice"] > 0)
    print(f"Total PV OCGN SKUs: {len(pv_list)} (with price: {pv_priced_count})")

    comparisons, matched_pv_skus = match_tgdd_to_pv(tgdd_prods, pv_list)
    matched_rows = [c for c in comparisons if c["pvSku"]]
    cheaper = sum(1 for c in matched_rows if c["compareStatus"] == "pv_cheaper")
    equal = sum(1 for c in matched_rows if c["compareStatus"] == "equal")
    higher = sum(1 for c in matched_rows if c["compareStatus"] == "pv_higher")
    tgdd_only = sum(1 for c in comparisons if c["compareStatus"] == "tgdd_only")

    print(f"\nMATCH SUMMARY: matched={len(matched_rows)} / {len(comparisons)} TGDD products")
    print(f"  PV Rẻ hơn: {cheaper} | Bằng giá: {equal} | PV Cao hơn: {higher} | Chỉ có ở TGDD: {tgdd_only}")
    print("\n--- MATCHED PAIRS ---")
    for c in matched_rows:
        print(
            f"  [{c['compareStatus']:10s}] TGDD: {c['tgddName'][:42]:42s} ({c['tgddPrice']:>10,}) "
            f"vs PV {c['pvSku']}: {c['pvName'][:42]:42s} ({c['pvPrice']:>10,}) | diff={c['diffVnd']:+,} ({c['diffPct']:+.1f}%) | tokens={c['matchTokens']}"
        )
    print("\n--- TGDD ONLY (UNMATCHED) ---")
    for c in comparisons:
        if not c["pvSku"]:
            print(f"  [tgdd_only ] {c['tgddBrand']:10s} | {c['driveType']:4s} | {c['capacity']:5s} | {c['tgddName']} | {c['tgddPrice']:,}")

    payload = {
        "meta": {
            "scrapedAt": datetime.datetime.now().isoformat(timespec="seconds"),
            "sourceName": "Thế Giới Di Động",
            "sourceUrl": TGDD_URL,
            "subcat": "NH11-01-07-Ổ cứng gắn ngoài",
            "tgddCount": len(tgdd_prods),
            "pvTotalCount": len(pv_list),
            "pvPricedCount": pv_priced_count,
            "matchedCount": len(matched_rows),
            "pvCheaperCount": cheaper,
            "equalCount": equal,
            "pvHigherCount": higher,
            "tgddOnlyCount": tgdd_only,
        },
        "rows": comparisons,
    }
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"\nSaved {OUT_FILE} ({OUT_FILE.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
