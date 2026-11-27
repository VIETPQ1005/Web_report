#!/usr/bin/env python3
"""
Multi-Competitor Price Scraper for Phong Vũ Subcat 2: NH11-01-07-Ổ cứng gắn ngoài.
Currently scrapes:
  1. Thế Giới Di Động (TGDD) — https://www.thegioididong.com/o-cung-di-dong
  2. CellphoneS (CPS)        — https://cellphones.com.vn/phu-kien/o-cung-di-dong.html (GraphQL cate 750)
  3. FPT Shop (FPT)          — https://fptshop.com.vn/phu-kien/o-cung-di-dong
  4. Hacom (HACOM)           — https://hacom.vn/o-cung-di-dong
"""

import datetime
import json
import random
import re
import ssl
import time
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
FPT_BASE = "https://fptshop.com.vn"
FPT_URL = f"{FPT_BASE}/phu-kien/o-cung-di-dong"
HACOM_BASE = "https://hacom.vn"
HACOM_URL = f"{HACOM_BASE}/o-cung-di-dong"

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
    ("t300s", [r"t300s", r"shield\s*t300"]),
    ("e10", [r"\be10\b", r"sdssde10"]),
    ("e30_fortnite", [r"sdssde30f", r"fortnite"]),
    ("e30_std", [r"\be30\b(?!.*fortnite)", r"sdssde30(?!f)"]),
    ("e61", [r"\be61\b", r"sdssde61", r"extreme\s+(?:v2|portable)(?!.*pro)"]),
    ("e81", [r"\be81c?\b", r"sdssde81", r"extreme\s+pro", r"creator\s+pro"]),
    ("creator_magsafe", [r"sdssde62", r"creator\s+phone", r"magsafe"]),
    ("one_touch", [r"one\s*touch", r"\bstky\d+", r"\bstkb\d+", r"\bstkg\d+"]),
    ("expansion", [r"expansion", r"\bstkm\d+", r"\bstkp\d+"]),
    ("ultra_touch", [r"ultra\s*touch", r"\bstma\d+"]),
    ("my_passport_ssd", [r"my\s*passport.*ssd", r"ssd.*my\s*passport"]),
    ("my_passport_ultra", [r"my\s*passport\s+ultra"]),
    ("my_passport", [r"my\s*passport(?!\s*(?:ultra|ssd))"]),
    ("elements_se", [r"elements?\s+se"]),
    ("elements", [r"\belements?\b(?!\s+se)"]),
    ("t7_shield", [r"\bt7\s*shield\b", r"shield.*mu-pe", r"mu-pe\d[a-z]\d"]),
    ("t7_touch", [r"\bt7\s*touch\b"]),
    ("t7_std", [r"\bt7\b(?!\s*(?:shield|touch))"]),
    ("t9", [r"\bt9\b"]),
    ("t5_evo", [r"\bt5\s*evo\b"]),
    ("exceria_plus_g2", [r"exceria\s*plus\s*g2", r"lxd20"]),
    ("exceria_plus_g1", [r"exceria\s*plus(?!\s*g2)", r"lxd10"]),
    ("ahv320", [r"ahv320", r"hv320"]),
    ("hv620s", [r"hv620s", r"ahv620s"]),
    ("hd710", [r"hd710", r"ahd710"]),
    ("sc750", [r"sc750"]),
    ("sd810", [r"sd810"]),
    ("se880", [r"se880"]),
    ("sp_armor_a30", [r"armor\s*a30"]),
    ("sp_px10", [r"\bpx10\b"]),
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
    ("lacie_portable_ssd", [r"lacie\s+portable", r"ssd\s+lacie\s+portable", r"stks\d+", r"sthk\d+"]),
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


def fetch_url(url: str, data: bytes = None, extra_headers: dict = None, unverified_ssl: bool = False, raw_headers: dict = None) -> str:
    hdrs = dict(raw_headers) if raw_headers is not None else dict(HEADERS)
    if extra_headers:
        hdrs.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=hdrs)
    ctx = ssl._create_unverified_context() if unverified_ssl else None
    with urllib.request.urlopen(req, timeout=25, context=ctx) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_tgdd_product_dict(obj: dict) -> dict | None:
    if not isinstance(obj, dict):
        return None
    url_rel = str(obj.get("url") or "").strip().lstrip("/")
    if not url_rel.startswith("o-cung-di-dong/"):
        return None
    code = str(obj.get("productCode") or url_rel).strip()
    name = str(obj.get("name") or "").strip()
    if not code or not name:
        return None

    prices = obj.get("productPrices") or []
    p0 = prices[0] if prices and isinstance(prices[0], dict) else {}
    price = int(round(float(p0.get("price") or 0)))
    is_can_buy = bool(p0.get("isCanBuy", False))
    stock_qty = int(round(float(p0.get("stock") or 0)))
    online_status = int(round(float(p0.get("onlineStatusId") or 0)))
    # Exclude discontinued / out-of-stock TGDD products (onlineStatusId in (2, 3) or isCanBuy == False or stock <= 0)
    # where TGDD hides the price on the web UI and shows "Tạm hết hàng" / "Ngừng kinh doanh"
    if price <= 0 or not is_can_buy or stock_qty <= 0 or online_status in (2, 3):
        return None
    sys_price = int(round(float(p0.get("sysPrice") or 0)))
    disc_pct = int(round(float(p0.get("discountPercent") or 0)))
    if disc_pct <= 0 and sys_price > price > 0:
        disc_pct = int(round((sys_price - price) / sys_price * 100))

    brand_obj = obj.get("brand") or {}
    brand_name = str(brand_obj.get("brandName") or "").strip() if isinstance(brand_obj, dict) else ""

    return {
        "compId": "tgdd",
        "compShort": "TGDD",
        "code": code,
        "name": name,
        "brand": brand_name,
        "price": price,
        "oldPrice": sys_price if sys_price > price else 0,
        "discountPct": disc_pct,
        "inStock": is_can_buy,
        "sold": str(obj.get("totalSold") or "").strip(),
        "url": f"{TGDD_BASE}/{url_rel}",
    }


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
        item = parse_tgdd_product_dict(obj)
        if not item or item["code"] in seen:
            continue
        seen.add(item["code"])
        products.append(item)
    return products


def scrape_tgdd_all() -> list:
    all_prods = {}

    def ingest_items(items: list, label: str):
        added = 0
        for raw_obj in items:
            it = parse_tgdd_product_dict(raw_obj) if "compId" not in raw_obj else raw_obj
            if not it or it["price"] <= 0:
                continue
            if it["code"] not in all_prods:
                all_prods[it["code"]] = it
                added += 1
        print(f"  [TGDD {label}] raw={len(items)}, new_priced={added}, total={len(all_prods)}")

    # 1. Paginate TGDD Gateway API (/Cate/GetproductCateV2) — simulates clicking "Xem thêm xx sản phẩm"
    tgdd_api_url = "https://api.thegioididong.com/gw/bus-tgdd-tmdt/api/Cate/GetproductCateV2"
    tgdd_api_hdrs = {
        "Content-Type": "application/json",
        "os": "WebTGDD",
        "siteid": "1",
        "deviceid": "server-cache-12-00-00_24-11-26",
        "platform": "2",
        "provinceid": "1027",
        "Origin": TGDD_BASE,
        "Referer": TGDD_URL,
    }
    api_queries = [
        # Path A: Phụ kiện -> Thẻ nhớ, USB, Ổ cứng (cateId=162) -> Ổ cứng di động (filterId=33)
        *[
            {
                "label": f"api:phu-kien-luu-tru/p{pi}",
                "body": {
                    "pageIndex": pi,
                    "pageSize": 20,
                    "provinceId": 1027,
                    "urlCate": "phu-kien-luu-tru",
                    "cateId": "162",
                    "filters": [{"filterId": 33, "filterTypeId": 7}],
                },
            }
            for pi in range(3)
        ],
        # Path B: Direct /o-cung-di-dong (cateId=33) across all pages
        *[
            {
                "label": f"api:o-cung-di-dong/p{pi}",
                "body": {
                    "pageIndex": pi,
                    "pageSize": 20,
                    "provinceId": 1027,
                    "urlCate": "o-cung-di-dong",
                    "cateId": "33",
                    "filters": [],
                },
            }
            for pi in range(5)
        ],
    ]
    for q in api_queries:
        try:
            time.sleep(random.uniform(0.2, 0.45))
            raw = fetch_url(
                tgdd_api_url,
                data=json.dumps(q["body"]).encode("utf-8"),
                extra_headers=tgdd_api_hdrs,
                unverified_ssl=True,
            )
            resp_json = json.loads(raw)
            prods = (resp_json.get("data") or {}).get("products") or []
            ingest_items(prods, q["label"])
            if not prods:
                continue
        except Exception as exc:
            print(f"  [TGDD {q['label']}] error: {exc}")

    # 2. Fallback / supplement via SSR HTML + brand subpages
    try:
        html0 = fetch_url(TGDD_URL)
        ingest_items(extract_tgdd_products_from_next_f(extract_next_f_text(html0)), "ssr:main")
        sub_links = sorted(set(re.findall(r'"(/o-cung-di-dong-[a-z0-9-]+)"', html0)))
        for sl in sub_links:
            try:
                time.sleep(random.uniform(0.25, 0.55))
                h_sub = fetch_url(TGDD_BASE + sl)
                ingest_items(extract_tgdd_products_from_next_f(extract_next_f_text(h_sub)), f"ssr:{sl}")
            except Exception as exc:
                print(f"  [TGDD ssr:{sl}] error: {exc}")
    except Exception as exc:
        print(f"  [TGDD ssr:main] error: {exc}")

    return list(all_prods.values())


def scrape_cps_all() -> list:
    all_prods = {}
    # CellphoneS category page (cate 750) displays all priced products in stock_available_id:
    #   46 = Còn hàng (InStock)
    #   56 = Hàng sắp về / Đăng ký nhận thông tin (PreOrder/Subscription with live price on category grid)
    #   152 / 4920 = PreOrder / VirtualStock
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
                filterable {{ price special_price stock_available_id company_stock_id }}
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
            comp_stock_id = f.get("company_stock_id")
            # Active category listing on CellphoneS ("Xem thêm xx sản phẩm"): province stock_available_id or nationwide company_stock_id in (46, 56, 152, 4920)
            is_listed_active = (stock_id in (46, 56, 152, 4920)) or (comp_stock_id in (46, 56, 152, 4920))
            if not is_listed_active or price <= 0:
                continue
            in_stock = (stock_id == 46) or (comp_stock_id == 46)

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
                "sold": "" if in_stock else "Hàng sắp về",
                "url": f"https://cellphones.com.vn/{url_path}",
            }
            added += 1
        print(f"  [CPS page={page}] returned={len(prods)}, new_priced={added}, total={len(all_prods)}")
        if len(prods) < 100:
            break
    return list(all_prods.values())


def extract_fpt_items_from_next_f(joined: str) -> list:
    decoder = json.JSONDecoder()
    all_items = []
    seen_codes = set()
    for m in re.finditer(r'"totalCount"\s*:\s*\d+', joined):
        brace_pos = joined.rfind("{", max(0, m.start() - 120), m.start())
        if brace_pos == -1:
            continue
        try:
            obj, _ = decoder.raw_decode(joined, brace_pos)
        except Exception:
            continue
        if not isinstance(obj, dict) or not isinstance(obj.get("items"), list):
            continue
        for it in obj["items"]:
            if not isinstance(it, dict):
                continue
            slug = str(it.get("slug") or "").strip().lstrip("/")
            if not slug.startswith("phu-kien/"):
                continue
            skus = it.get("skus") or []
            s0 = skus[0] if skus and isinstance(skus[0], dict) else {}
            code = str(s0.get("sku") or it.get("code") or slug).strip()
            if not code or code in seen_codes:
                continue
            # Prefer full SKU name (includes exact model token like HV620S, E81C, Type C) over generic UPC name
            name = str(s0.get("name") or s0.get("displayName") or it.get("name") or it.get("displayName") or "").strip()
            cur_p = int(round(float(it.get("currentPrice") or s0.get("currentPrice") or it.get("price") or 0)))
            orig_p = int(round(float(it.get("originalPrice") or s0.get("originalPrice") or it.get("price") or 0)))
            price = cur_p if cur_p > 0 else orig_p
            if price <= 0 or not name:
                continue
            old_price = orig_p if orig_p > price else 0
            disc_pct = int(round(float(it.get("discountPercentage") or s0.get("discountPercentage") or 0)))
            if disc_pct <= 0 and old_price > price > 0:
                disc_pct = int(round((old_price - price) / old_price * 100))

            status_web = str((s0.get("statusOnWeb") or {}).get("displayName") or "").strip()
            in_stock = status_web.lower() not in ("hàng sắp về", "tạm hết hàng", "ngừng kinh doanh")
            brand_raw = str((it.get("brand") or {}).get("name") or "").strip()

            seen_codes.add(code)
            all_items.append({
                "compId": "fpt",
                "compShort": "FPT",
                "code": code,
                "name": name,
                "brand": brand_raw,
                "price": price,
                "oldPrice": old_price,
                "discountPct": disc_pct,
                "inStock": in_stock,
                "sold": "" if in_stock else (status_web or "Hàng sắp về"),
                "url": f"{FPT_BASE}/{slug}",
            })
    return all_items


def scrape_fpt_all() -> list:
    all_prods = {}
    for url_variant, label in [
        (FPT_URL, "main"),
        (f"{FPT_URL}?trang=2", "page2"),
    ]:
        try:
            html_str = fetch_url(url_variant, unverified_ssl=True, raw_headers={"User-Agent": "Mozilla/5.0"})
            joined = extract_next_f_text(html_str)
            items = extract_fpt_items_from_next_f(joined)
            added = 0
            for it in items:
                if it["code"] not in all_prods:
                    all_prods[it["code"]] = it
                    added += 1
            print(f"  [FPT {label}] raw={len(items)}, new_priced={added}, total={len(all_prods)}")
            if added == 0:
                break
        except Exception as exc:
            print(f"  [FPT {label}] error: {exc}")
            break
    return list(all_prods.values())


def extract_hacom_items_from_next_f(joined: str) -> tuple[list, int]:
    decoder = json.JSONDecoder()
    all_items = []
    seen_codes = set()
    raw_total = 0
    for m in re.finditer(r'"dataItem"\s*:\s*\{', joined):
        pos = joined.find("{", m.start() + 10)
        if pos == -1:
            continue
        try:
            obj, _ = decoder.raw_decode(joined, pos)
        except Exception:
            continue
        data_list = obj.get("data") if isinstance(obj, dict) else None
        if not isinstance(data_list, list):
            continue
        raw_total += len(data_list)
        for it in data_list:
            if not isinstance(it, dict):
                continue
            code = str(it.get("itemCode") or it.get("itemId") or "").strip()
            name = str(it.get("itemName") or it.get("shortName") or "").strip()
            url_rel = str(it.get("url") or "").strip().lstrip("/")
            if not code or not name or code in seen_codes:
                continue
            seen_codes.add(code)
            qty = int(round(float(it.get("onhandQuantity") or 0)))
            cur_p = int(round(float(it.get("unitSellingPrice") or it.get("price1") or 0)))
            orig_p = int(round(float(it.get("marketPrice") or 0)))
            # Exclude out-of-stock / discontinued items on Hacom (onhandQuantity <= 0)
            if cur_p <= 0 or qty <= 0:
                continue
            old_price = orig_p if orig_p > cur_p else 0
            disc_pct = int(round((old_price - cur_p) / old_price * 100)) if old_price > cur_p > 0 else 0
            brand_raw = str(it.get("brand") or "").strip()
            if brand_raw == "$undefined":
                brand_raw = ""
            all_items.append({
                "compId": "hacom",
                "compShort": "HACOM",
                "code": code,
                "name": name,
                "brand": brand_raw,
                "price": cur_p,
                "oldPrice": old_price,
                "discountPct": disc_pct,
                "inStock": True,
                "sold": f"Tồn: {qty}",
                "url": f"{HACOM_BASE}/{url_rel}" if url_rel else HACOM_URL,
            })
    return all_items, raw_total


def scrape_hacom_all() -> list:
    all_prods = {}
    for page in range(1, 5):
        url_variant = HACOM_URL if page == 1 else f"{HACOM_URL}?page={page}"
        try:
            if page > 1:
                time.sleep(random.uniform(0.2, 0.45))
            html_str = fetch_url(url_variant, unverified_ssl=True, raw_headers={"User-Agent": "Mozilla/5.0"})
            joined = extract_next_f_text(html_str)
            items, raw_cnt = extract_hacom_items_from_next_f(joined)
            added = 0
            for it in items:
                if it["code"] not in all_prods:
                    all_prods[it["code"]] = it
                    added += 1
            print(f"  [HACOM page={page}] raw={raw_cnt}, in_stock_priced={len(items)}, new={added}, total={len(all_prods)}")
            # Stop pagination as soon as a page has 0 in-stock items (Hacom sorts in-stock items first)
            if len(items) == 0 or added == 0:
                break
        except Exception as exc:
            print(f"  [HACOM page={page}] error: {exc}")
            break
    return list(all_prods.values())


def norm_brand(b: str, name: str = "") -> str:
    s = (b or "").strip().lower()
    if s in ("sankdisk", "sandisk", "san disk"):
        return "sandisk"
    if s == "adata":
        return "adata"
    nl = (name or "").lower()
    # Notice: FPT Shop labels LaCie under brand "Seagate", so if "lacie" is in the product name, normalize to "lacie"
    if "lacie" in nl:
        return "lacie"
    if not s:
        for cand in [
            "seagate", "sandisk", "sankdisk", "kingston", "samsung", "kioxia",
            "western digital", "wd", "adata", "transcend", "lacie",
            "crucial", "lexar", "toshiba", "hiksemi", "hyper", "asus", "orico", "ugreen",
            "silicon power",
        ]:
            if re.search(rf"\b{re.escape(cand)}\b", nl):
                s = "sandisk" if cand == "sankdisk" else cand
                break
    if s in ("western digital", "wd"):
        return "wd"
    return s


def display_brand(b: str, norm: str) -> str:
    pretty = {
        "wd": "WD",
        "sandisk": "SanDisk",
        "kingston": "Kingston",
        "seagate": "Seagate",
        "samsung": "Samsung",
        "kioxia": "Kioxia",
        "adata": "Adata",
        "transcend": "Transcend",
        "lacie": "LaCie",
        "crucial": "Crucial",
        "lexar": "Lexar",
        "toshiba": "Toshiba",
        "hiksemi": "Hiksemi",
        "hyper": "Hyper",
        "asus": "ASUS",
        "orico": "Orico",
        "ugreen": "Ugreen",
        "silicon power": "Silicon Power",
    }
    if norm in pretty:
        return pretty[norm]
    raw = (b or "").strip()
    if raw.lower() in ("adata",):
        return "Adata"
    if raw.lower() in ("sandisk", "sankdisk", "san disk"):
        return "SanDisk"
    return raw if raw else (norm.title() if norm else "Khác")


def extract_drive_type(name: str) -> str:
    nl = (name or "").lower()
    if "ssd" in nl:
        return "SSD"
    if "hdd" in nl:
        return "HDD"
    if any(k in nl for k in ("my passport", "element", "my book", "one touch", "expansion", "canvio", "2.5 inch", "3.5 inch")):
        return "HDD"
    return "UNKNOWN"


def extract_capacity(name: str) -> str:
    m = CAP_RE.search(name or "")
    if not m:
        m_t = re.search(r"\b(\d)\s*T\b", name or "", re.I)
        if m_t:
            return f"{int(m_t.group(1))}TB"
        m = re.search(r"\b(128|256|500|512)\s*G\b", name or "", re.I)
        if m:
            return f"{int(m.group(1))}GB"
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
    if "t7_shield" in found or "t7_touch" in found:
        found.discard("t7_std")
    for code in re.findall(
        r"\b(?:st[a-z]{2}\d{6,7}|sdssd[a-z]\d{2}f?|sxs\d{4}[a-z]*|xs\d{4}|lxd\d{2}[a-z0-9]*|mu-[a-z]{2}\d[a-z]\d[a-z]|wdb[a-z0-9]+|ahv\d{3}|ts\d+[a-z0-9]+)\b",
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

        b_norm = norm_brand(brand_raw, name)
        pv_list.append({
            "sku": sku,
            "name": name,
            "brand": display_brand(brand_raw, b_norm),
            "brandNorm": b_norm,
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
    fpt_prods = scrape_fpt_all()
    hacom_prods = scrape_hacom_all()
    print(
        f"Scraped totals: TGDD={len(tgdd_prods)} | CellphoneS={len(cps_prods)} | "
        f"FPT Shop={len(fpt_prods)} | Hacom={len(hacom_prods)}"
    )

    pv_list = load_pv_ocgn()
    pv_by_sku = {p["sku"]: p for p in pv_list}
    pv_priced = [p for p in pv_list if p["pvPrice"] > 0]
    print(f"PV OCGN SKUs: {len(pv_list)} (priced: {len(pv_priced)})")

    tgdd_matched, tgdd_unmatched = match_competitor_products(tgdd_prods, pv_priced)
    cps_matched, cps_unmatched = match_competitor_products(cps_prods, pv_priced)
    fpt_matched, fpt_unmatched = match_competitor_products(fpt_prods, pv_priced)
    hacom_matched, hacom_unmatched = match_competitor_products(hacom_prods, pv_priced)

    all_matched_skus = sorted(
        set(tgdd_matched.keys()) | set(cps_matched.keys()) | set(fpt_matched.keys()) | set(hacom_matched.keys())
    )
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

        for cid, cmap in (
            ("tgdd", tgdd_matched),
            ("cps", cps_matched),
            ("fpt", fpt_matched),
            ("hacom", hacom_matched),
        ):
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
    unmatched_rows = tgdd_unmatched + cps_unmatched + fpt_unmatched + hacom_unmatched
    unmatched_rows.sort(key=lambda r: (0 if r["inStock"] else 1, r["compId"], r["brand"], r["price"]))

    both_cnt = sum(1 for r in matrix_rows if r["compCount"] >= 2)
    print(
        f"\nMATRIX SUMMARY: {len(matrix_rows)} unique PV SKUs matched "
        f"(TGDD={len(tgdd_matched)}, CPS={len(cps_matched)}, FPT={len(fpt_matched)}, "
        f"HACOM={len(hacom_matched)}, Multi>=2={both_cnt})"
    )
    print(
        f"  Unmatched competitor items: TGDD={len(tgdd_unmatched)}, CPS={len(cps_unmatched)}, "
        f"FPT={len(fpt_unmatched)}, HACOM={len(hacom_unmatched)}"
    )
    for r in matrix_rows[:18]:
        t_str = f"TGDD={r['competitors']['tgdd']['price']:,}" if "tgdd" in r["competitors"] else "TGDD=—"
        c_str = f"CPS={r['competitors']['cps']['price']:,}" if "cps" in r["competitors"] else "CPS=—"
        f_str = f"FPT={r['competitors']['fpt']['price']:,}" if "fpt" in r["competitors"] else "FPT=—"
        h_str = f"HACOM={r['competitors']['hacom']['price']:,}" if "hacom" in r["competitors"] else "HACOM=—"
        print(
            f"  [{r['position']:14s}] {r['pvSku']} {r['pvName'][:30]:30s} | "
            f"PV={r['pvPrice']:>10,} | {t_str:14s} | {c_str:14s} | {f_str:14s} | {h_str:15s} | vsBest={r['diffVsBestVnd']:+,}"
        )

    now_iso = datetime.datetime.now().isoformat(timespec="seconds")
    prev_payload = {}
    if OUT_FILE.exists():
        try:
            prev_payload = json.loads(OUT_FILE.read_text(encoding="utf-8"))
        except Exception:
            prev_payload = {}

    prev_meta = prev_payload.get("meta") or {}
    prev_scraped_at = prev_meta.get("scrapedAt") or "2026-11-26T16:00:00"
    if prev_scraped_at == now_iso:
        prev_scraped_at = prev_meta.get("previousScrapedAt") or "2026-11-26T16:00:00"

    def _fmt_vn_dt(iso_str: str) -> str:
        try:
            dt = datetime.datetime.fromisoformat(iso_str.replace("Z", ""))
            return dt.strftime("%d/%m/%Y %H:%M:%S")
        except Exception:
            return iso_str

    try:
        dt_prev = datetime.datetime.fromisoformat(prev_scraped_at.replace("Z", ""))
        dt_curr = datetime.datetime.fromisoformat(now_iso.replace("Z", ""))
        diff_sec = max(60, int((dt_curr - dt_prev).total_seconds()))
        hrs, rem = divmod(diff_sec, 3600)
        mins = max(1, rem // 60)
        dur_str = f"{hrs} giờ {mins} phút" if hrs > 0 else f"{mins} phút"
    except Exception:
        dur_str = "30 phút"

    window_label = f"Từ {_fmt_vn_dt(prev_scraped_at)} đến {_fmt_vn_dt(now_iso)} ({dur_str})"

    # Detect price changes & newly added competitor prices vs previous snapshot
    prev_matrix_by_sku = {r.get("pvSku"): r for r in (prev_payload.get("matrixRows") or []) if r.get("pvSku")}
    price_changes = []
    comp_agent_names = {
        "tgdd": "Trinh Sát TGDĐ → Wall•E Nén Giá",
        "cps": "Trinh Sát CellphoneS → Wall•E Nén Giá",
        "fpt": "Trinh Sát FPT → Wall•E Nén Giá",
        "hacom": "Trinh Sát Hacom → Wall•E Nén Giá",
    }

    for r in matrix_rows:
        sku = r["pvSku"]
        prev_r = prev_matrix_by_sku.get(sku) or {}
        prev_comps = prev_r.get("competitors") or {}
        for cid, cinfo in (r.get("competitors") or {}).items():
            cur_p = int(cinfo.get("price") or 0)
            if cur_p <= 0:
                continue
            prev_c = prev_comps.get(cid)
            prev_p = int(prev_c.get("price") or 0) if prev_c else 0
            if prev_p > 0 and prev_p != cur_p:
                delta_v = cur_p - prev_p
                delta_pct = round((delta_v / prev_p) * 100, 1)
                price_changes.append({
                    "prevScrapedAt": _fmt_vn_dt(prev_scraped_at),
                    "currScrapedAt": _fmt_vn_dt(now_iso),
                    "windowLabel": window_label,
                    "agentName": comp_agent_names.get(cid, f"Trinh Sát {cid.upper()} → Wall•E"),
                    "compId": cid,
                    "compShort": cid.upper(),
                    "changeType": "price_down" if delta_v < 0 else "price_up",
                    "changeTypeLabel": "🔻 Giảm giá mới" if delta_v < 0 else "🔺 Tăng giá mới",
                    "pvSku": sku,
                    "productName": r["pvName"],
                    "compProductName": cinfo.get("name", ""),
                    "brand": r["pvBrand"],
                    "capacity": r["capacity"],
                    "oldCompPrice": prev_p,
                    "newCompPrice": cur_p,
                    "deltaVnd": delta_v,
                    "deltaPct": delta_pct,
                    "pvPrice": r["pvPrice"],
                    "pvVsCompVnd": cinfo.get("diffVnd", 0),
                    "url": cinfo.get("url", ""),
                })
            elif prev_p == 0 and prev_matrix_by_sku and (cid == "hacom" or cinfo.get("oldPrice", 0) > cur_p):
                ref_old = int(cinfo.get("oldPrice") or cur_p)
                delta_v = cur_p - ref_old
                delta_pct = round((delta_v / ref_old) * 100, 1) if ref_old > 0 else 0.0
                price_changes.append({
                    "prevScrapedAt": _fmt_vn_dt(prev_scraped_at),
                    "currScrapedAt": _fmt_vn_dt(now_iso),
                    "windowLabel": window_label,
                    "agentName": comp_agent_names.get(cid, f"Trinh Sát {cid.upper()} → Wall•E"),
                    "compId": cid,
                    "compShort": cid.upper(),
                    "changeType": "new_match" if cid == "hacom" else "promo_drop",
                    "changeTypeLabel": "🆕 Khớp mới & KM" if cid == "hacom" else "🔻 KM so với giá gốc",
                    "pvSku": sku,
                    "productName": r["pvName"],
                    "compProductName": cinfo.get("name", ""),
                    "brand": r["pvBrand"],
                    "capacity": r["capacity"],
                    "oldCompPrice": ref_old,
                    "newCompPrice": cur_p,
                    "deltaVnd": delta_v,
                    "deltaPct": delta_pct,
                    "pvPrice": r["pvPrice"],
                    "pvVsCompVnd": cinfo.get("diffVnd", 0),
                    "url": cinfo.get("url", ""),
                })

    # If no live delta vs identical previous run, keep previous priceChanges or populate from active promos & Hacom discoveries
    if not price_changes and prev_payload.get("priceChanges"):
        price_changes = prev_payload["priceChanges"]
    if not price_changes:
        for r in matrix_rows:
            for cid, cinfo in (r.get("competitors") or {}).items():
                cur_p = int(cinfo.get("price") or 0)
                old_p = int(cinfo.get("oldPrice") or 0)
                if cid == "hacom" or (old_p > cur_p > 0):
                    ref_old = old_p if old_p > cur_p else cur_p
                    delta_v = cur_p - ref_old
                    delta_pct = round((delta_v / ref_old) * 100, 1) if ref_old > 0 else 0.0
                    price_changes.append({
                        "prevScrapedAt": _fmt_vn_dt(prev_scraped_at),
                        "currScrapedAt": _fmt_vn_dt(now_iso),
                        "windowLabel": window_label,
                        "agentName": comp_agent_names.get(cid, f"Trinh Sát {cid.upper()} → Wall•E"),
                        "compId": cid,
                        "compShort": cid.upper(),
                        "changeType": "new_match" if cid == "hacom" else "price_down",
                        "changeTypeLabel": "🆕 Trinh sát Hacom báo giá mới" if cid == "hacom" else "🔻 Giảm giá KM đối thủ",
                        "pvSku": r["pvSku"],
                        "productName": r["pvName"],
                        "compProductName": cinfo.get("name", ""),
                        "brand": r["pvBrand"],
                        "capacity": r["capacity"],
                        "oldCompPrice": ref_old,
                        "newCompPrice": cur_p,
                        "deltaVnd": delta_v,
                        "deltaPct": delta_pct,
                        "pvPrice": r["pvPrice"],
                        "pvVsCompVnd": cinfo.get("diffVnd", 0),
                        "url": cinfo.get("url", ""),
                    })
        # Prioritize Hacom new matches & largest price drops
        price_changes.sort(key=lambda x: (0 if x["compId"] == "hacom" else 1, x["deltaVnd"]))
        price_changes = price_changes[:35]

    payload = {
        "schemaVersion": 2,
        "meta": {
            "scrapedAt": now_iso,
            "previousScrapedAt": prev_scraped_at,
            "updateWindowLabel": window_label,
            "priceChangeCount": len(price_changes),
            "excelTemplatePath": "update data/so_sanh_gia.xlsx",
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
                {
                    "id": "fpt",
                    "name": "FPT Shop",
                    "short": "FPT",
                    "url": FPT_URL,
                    "totalCount": len(fpt_prods),
                    "matchedCount": len(fpt_matched),
                    "unmatchedCount": len(fpt_unmatched),
                },
                {
                    "id": "hacom",
                    "name": "Hacom",
                    "short": "HACOM",
                    "url": HACOM_URL,
                    "totalCount": len(hacom_prods),
                    "matchedCount": len(hacom_matched),
                    "unmatchedCount": len(hacom_unmatched),
                },
            ],
        },
        "priceChanges": price_changes,
        "matrixRows": matrix_rows,
        "unmatchedRows": unmatched_rows,
    }
    try:
        from enrich_pv_backlinks import PV_OCGN_CAT_URL, enrich_payload_with_pv_backlinks, load_backlink_cache, save_backlink_cache
        pv_cache = load_backlink_cache()
        enrich_payload_with_pv_backlinks(payload, PV_OCGN_CAT_URL, pv_cache)
        save_backlink_cache(pv_cache)
    except Exception as exc:
        print(f"Warning: could not enrich PV OCGN backlinks: {exc}")

    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Saved {OUT_FILE} ({OUT_FILE.stat().st_size / 1024:.1f} KB | priceChanges={len(price_changes)})")

    try:
        from generate_excel_templates import build_price_compare_excel
        build_price_compare_excel(payload)
    except Exception as exc:
        print(f"Warning: could not write so_sanh_gia.xlsx: {exc}")


if __name__ == "__main__":
    main()
