#!/usr/bin/env python3
"""
Multi-Competitor Price Scraper for Phong Vũ Subcat 2: NH06-03-01-Loa
Strictly restricted to the 7 target speaker brands requested by the user:
  - Sony, Alpha Works, Havit, Microlab, SoundMax, Tronsmart, Marshall

Scrapes the 7 target competitor speaker URLs assigned to the 4 Scouts:
  1. Trinh Sát TGDĐ       — https://www.thegioididong.com/loa-laptop#o=1&pi=2 (Cate 69)
  2. Trinh Sát CellphoneS — https://cellphones.com.vn/thiet-bi-am-thanh/loa/loa-bluetooth.html (Cate 112)
                          & https://cellphones.com.vn/thiet-bi-am-thanh/loa/karaoke.html (Cate 2475)
  3. Trinh Sát FPT        — https://fptshop.com.vn/phu-kien/loa
                          & https://fptshop.com.vn/phu-kien/loa?loai-san-pham=loa-karaoke&sortMethod=noi-bat&sort=noi-bat (+ 7 brand subpages)
  4. Trinh Sát Hacom      — https://hacom.vn/loa-bluetooth & https://hacom.vn/loa-vi-tinh

Outputs:
  - `public/data/price_compare_loa.json`
  - Also updates `update data/so_sanh_gia.xlsx` & `public/data/so_sanh_gia.xlsx`
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
OUT_FILE = BASE_DIR / "public" / "data" / "price_compare_loa.json"
LOOKUP_MASTER = BASE_DIR / "public" / "data" / "lookup_master.json"
REPORT_DATA = BASE_DIR / "public" / "data" / "report_data.json"

TGDD_BASE = "https://www.thegioididong.com"
TGDD_LOA_URL = f"{TGDD_BASE}/loa-laptop#o=1&pi=2"
CPS_LOA_URL = "https://cellphones.com.vn/thiet-bi-am-thanh/loa/loa-bluetooth.html"
CPS_KARAOKE_URL = "https://cellphones.com.vn/thiet-bi-am-thanh/loa/karaoke.html"
CPS_GQL_URL = "https://api.cellphones.com.vn/v2/graphql/query"
FPT_BASE = "https://fptshop.com.vn"
FPT_LOA_URL = f"{FPT_BASE}/phu-kien/loa"
FPT_KARAOKE_URL = f"{FPT_BASE}/phu-kien/loa?loai-san-pham=loa-karaoke&sortMethod=noi-bat&sort=noi-bat"
HACOM_BASE = "https://hacom.vn"
HACOM_LOA_BT_URL = f"{HACOM_BASE}/loa-bluetooth"
HACOM_LOA_VT_URL = f"{HACOM_BASE}/loa-vi-tinh"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
}

TARGET_BRANDS = [
    ("alpha works", "Alpha Works"),
    ("alphaworks", "Alpha Works"),
    ("marshall", "Marshall"),
    ("tronsmart", "Tronsmart"),
    ("microlab", "Microlab"),
    ("soundmax", "SoundMax"),
    ("havit", "Havit"),
    ("sony", "Sony"),
]

COLOR_MAP = {
    "đen": "den", "black": "den",
    "bạc": "bac", "silver": "bac",
    "xám": "xam", "grey": "xam", "gray": "xam",
    "xanh": "xanh", "blue": "xanh", "green": "xanh",
    "đỏ": "do", "red": "do",
    "trắng": "trang", "white": "trang",
    "kem": "kem", "cream": "kem",
    "cam": "cam", "orange": "cam",
    "hồng": "hong", "pink": "hong",
    "nâu": "nau", "brown": "nau",
}

ROMAN_TO_NUM = {
    "iv": "4",
    "iii": "3",
    "ii": "2",
}


def fetch_url(url: str, data: bytes = None, extra_headers: dict = None, unverified_ssl: bool = False, raw_headers: dict = None) -> str:
    hdrs = dict(raw_headers) if raw_headers is not None else dict(HEADERS)
    if extra_headers:
        hdrs.update(extra_headers)
    req = urllib.request.Request(url, data=data, headers=hdrs)
    ctx = ssl._create_unverified_context() if unverified_ssl else None
    with urllib.request.urlopen(req, timeout=25, context=ctx) as resp:
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


def detect_target_brand(brand_raw: str, name: str = "") -> str:
    hay = f"{brand_raw or ''} {name or ''}".lower()
    for pat, disp in TARGET_BRANDS:
        if re.search(rf"\b{re.escape(pat)}\b", hay):
            return disp
    return ""


def classify_speaker_type(name: str, subcat3: str = "") -> str:
    hay = f"{name or ''} {subcat3 or ''}".lower()
    if any(k in hay for k in ("karaoke", "loa kéo", "ult tower", "xv500", "xv800", "xv900", "xp500", "xp700", "ikon", "genbeat", "sonik", "halo")):
        return "Loa Karaoke"
    if any(k in hay for k in ("vi tính", "2.0", "2.1", "4.1", "5.1", "soundbar pc", "loa dàn")):
        return "Loa vi tính"
    return "Loa Bluetooth"


def extract_wattage(name: str) -> str:
    m = re.search(r"\b(\d+(?:\.\d+)?)\s*W\b", name or "", re.I)
    if not m:
        return ""
    v = float(m.group(1))
    return f"{int(v) if v.is_integer() else v}W"


def extract_colors(name: str) -> set:
    nl = (name or "").lower()
    cols = set()
    for k, v in COLOR_MAP.items():
        if re.search(rf"(?:^|[\s(/,-]){re.escape(k)}(?:$|[\s)/,-])", nl):
            cols.add(v)
    return cols


# Specific speaker model extractors across the 7 brands
NAMED_SPEAKER_PATTERNS = [
    # Sony
    ("sony_ult_field_1", [r"ult\s*field\s*1\b", r"srs-?ult10\b"]),
    ("sony_ult_field_3", [r"ult\s*field\s*3\b", r"srs-?ult30\b"]),
    ("sony_ult_field_5", [r"ult\s*field\s*5\b", r"srs-?ult50\b"]),
    ("sony_ult_field_7", [r"ult\s*field\s*7\b", r"srs-?ult70\b"]),
    ("sony_ult_tower_5", [r"ult\s*tower\s*5\b", r"srs-?ult500\b"]),
    ("sony_ult_tower_7", [r"ult\s*tower\s*7\b", r"srs-?ult700\b"]),
    ("sony_ult_tower_9", [r"ult\s*tower\s*9\b", r"srs-?ult900\b"]),
    ("sony_ult_tower_10", [r"ult\s*tower\s*10\b", r"srs-?ult1000\b"]),
    ("sony_ult_tower_max", [r"ult\s*tower\s*max\b", r"srs-?ult3000\b"]),
    ("sony_xb100", [r"srs-?xb100\b", r"\bxb100\b"]),
    ("sony_xb13", [r"srs-?xb13\b", r"\bxb13\b"]),
    ("sony_xe200", [r"srs-?xe200\b", r"\bxe200\b"]),
    ("sony_xe300", [r"srs-?xe300\b", r"\bxe300\b"]),
    ("sony_xg300", [r"srs-?xg300\b", r"\bxg300\b"]),
    ("sony_xg500", [r"srs-?xg500\b", r"\bxg500\b"]),
    ("sony_xv500", [r"srs-?xv500\b", r"\bxv500\b"]),
    ("sony_xv800", [r"srs-?xv800\b", r"\bxv800\b"]),
    ("sony_xv900", [r"srs-?xv900\b", r"\bxv900\b"]),
    ("sony_xp500", [r"srs-?xp500\b", r"\bxp500\b"]),
    ("sony_xp700", [r"srs-?xp700\b", r"\bxp700\b"]),
    ("sony_lspX_s3", [r"lspx-?s3\b"]),
    ("sony_ht_s100f", [r"ht-?s100f\b"]),
    ("sony_ht_s20r", [r"ht-?s20r\b"]),
    ("sony_ht_s40r", [r"ht-?s40r\b"]),
    ("sony_ht_a3000", [r"ht-?a3000\b"]),
    # Marshall (normalize roman numerals II/III/IV -> 2/3/4)
    ("marshall_willen_2", [r"willen\s*(?:ii|2)\b"]),
    ("marshall_willen_1", [r"willen\b(?!\s*(?:ii|2))"]),
    ("marshall_emberton_3", [r"emberton\s*(?:iii|3)\b"]),
    ("marshall_emberton_2", [r"emberton\s*(?:ii|2)\b"]),
    ("marshall_emberton_1", [r"emberton\b(?!\s*(?:ii|iii|2|3))"]),
    ("marshall_acton_4", [r"acton\s*(?:iv|4)\b"]),
    ("marshall_acton_3", [r"acton\s*(?:iii|3)\b"]),
    ("marshall_acton_2", [r"acton\s*(?:ii|2)\b"]),
    ("marshall_stanmore_4", [r"stanmore\s*(?:iv|4)\b"]),
    ("marshall_stanmore_3", [r"stanmore\s*(?:iii|3)\b"]),
    ("marshall_stanmore_2", [r"stanmore\s*(?:ii|2)\b"]),
    ("marshall_woburn_3", [r"woburn\s*(?:iii|3)\b"]),
    ("marshall_woburn_2", [r"woburn\s*(?:ii|2)\b"]),
    ("marshall_kilburn_3", [r"kilburn\s*(?:iii|3)\b"]),
    ("marshall_kilburn_2", [r"kilburn\s*(?:ii|2)\b"]),
    ("marshall_stockwell_3", [r"stockwell\s*(?:iii|3)\b"]),
    ("marshall_stockwell_2", [r"stockwell\s*(?:ii|2)\b"]),
    ("marshall_middleton_2", [r"middleton\s*(?:ii|2)\b"]),
    ("marshall_middleton_1", [r"middleton\b(?!\s*(?:ii|2))"]),
    ("marshall_tufton", [r"tufton\b"]),
    ("marshall_uxbridge", [r"uxbridge\b"]),
    # Alpha Works
    ("aw_w38", [r"\b(?:aw-?)?w38\b"]),
    ("aw_w39", [r"\b(?:aw-?)?w39\b"]),
    ("aw_w88", [r"\b(?:aw-?)?w88\b"]),
    ("aw_w89", [r"\b(?:aw-?)?w89\b"]),
    ("aw_w99", [r"\b(?:aw-?)?w99\b"]),
    ("aw_ride", [r"\b(?:aw-?)?ride\b"]),
    ("aw_ikon10", [r"ikon\s*10\b"]),
    ("aw_ikon12", [r"ikon\s*12\b"]),
    ("aw_ikon20", [r"ikon\s*20\b"]),
    ("aw_sonik60", [r"sonik\s*60\b"]),
    ("aw_sonik120", [r"sonik\s*120\b"]),
    ("aw_v60", [r"\b(?:aw-?)?v60\b"]),
    ("aw_v80", [r"\b(?:aw-?)?v80\b"]),
    ("aw_v100", [r"\b(?:aw-?)?v100\b"]),
    ("aw_classic_v60", [r"classic\s*v60\b"]),
    ("aw_classic_v80", [r"classic\s*v80\b"]),
    ("aw_classic_v100", [r"classic\s*v100\b"]),
    ("aw_genbeat_100", [r"genbeat\s*100\b"]),
    ("aw_genbeat_200", [r"genbeat\s*200\b"]),
    ("aw_genbeat_510", [r"genbeat\s*510\b"]),
    # Tronsmart
    ("tronsmart_t8_mini", [r"\bt8\s*mini\b"]),
    ("tronsmart_t8_std", [r"\bt8\b(?!\s*mini)"]),
    ("tronsmart_t7_mini", [r"\bt7\s*mini\b"]),
    ("tronsmart_t7_lite", [r"\bt7\s*lite\b"]),
    ("tronsmart_t7_std", [r"\bt7\b(?!\s*(?:mini|lite))"]),
    ("tronsmart_t6_plus", [r"\bt6\s*plus\b"]),
    ("tronsmart_t6_max", [r"\bt6\s*max\b"]),
    ("tronsmart_t6_mini", [r"\bt6\s*mini\b"]),
    ("tronsmart_t2_plus", [r"\bt2\s*plus\b"]),
    ("tronsmart_t2_mini", [r"\bt2\s*mini\b"]),
    ("tronsmart_bang_se", [r"\bbang\s*se\b"]),
    ("tronsmart_bang_mini", [r"\bbang\s*mini\b"]),
    ("tronsmart_bang_max", [r"\bbang\s*max\b"]),
    ("tronsmart_bang_std", [r"\bbang\b(?!\s*(?:se|mini|max))"]),
    ("tronsmart_halo_100", [r"halo\s*100\b"]),
    ("tronsmart_halo_110", [r"halo\s*110\b"]),
    ("tronsmart_halo_200", [r"halo\s*200\b"]),
    ("tronsmart_mirtune_c2", [r"mirtune\s*c2\b"]),
    ("tronsmart_mirtune_h1", [r"mirtune\s*h1\b"]),
    ("tronsmart_mirtune_s100", [r"mirtune\s*s100\b"]),
    ("tronsmart_trip_2", [r"\btrip\s*2\b"]),
    ("tronsmart_trip_1", [r"\btrip\b(?!\s*2)"]),
    ("tronsmart_nimo", [r"\bnimo\b"]),
    ("tronsmart_groove_2", [r"groove\s*2\b"]),
]


def extract_speaker_models(name: str, brand: str = "") -> set:
    nl = (name or "").lower()
    # Ignore turntable / non-speaker items
    if "đĩa than" in nl or "ps-lx" in nl:
        return set()
    found = set()
    for tag, pats in NAMED_SPEAKER_PATTERNS:
        for pat in pats:
            if re.search(pat, nl):
                found.add(tag)
                break

    # Alphanumeric model codes for Microlab, SoundMax, Havit, Sony, etc.
    # Examples:
    #   Microlab: B15, B16, B22, B25, B27B-BT, B51, B56, B70, B73, B77BT, M105, M106BT, M-108BT -> m108bt, M118BT, M300BT, M590, U210, U270BT, X2, X2BT, X3BT, MS210, MS212, FC360, FC570BT, Solo 6C, Solo 11
    #   SoundMax: A120, A130, A140, A150, A160, A180, A190, A600, A700, A820, A827, A890, A892, A910, A960, A980, A2120, A2126, A2129, A2130, A2140, SB-201 -> sb201, SB-202, SB-212, R-100, R-200, R-300, M-2, M-6, M-22, AK-600
    #   Havit: SK202, SK204, SK206, SK210, SK563, SK708, SK750, SK763, SK800BT, SK822BT, SK832BT, SK835BT, SK838BT, SF112BT
    cleaned = re.sub(r"/(?:1\.0|2\.0|2\.1|4\.1|5\.1|[a-z]{2,4}\d*)\b", " ", nl)
    for m in re.finditer(
        r"\b(?:"
        r"sk\d{3,4}(?:bt|pro)?|"
        r"sf\d{3,4}(?:bt)?|"
        r"hv-?sk\d{3,4}(?:bt)?|"
        r"sb-?\d{3,4}(?:bt)?|"
        r"ak-?\d{3,4}|"
        r"fc-?\d{3,4}(?:bt)?|"
        r"ms-?\d{3,4}(?:bt)?|"
        r"tm-?\d{3,4}(?:bt)?|"
        r"u-?\d{3,4}(?:bt)?|"
        r"a-?\d{3,4}(?:bt)?|"
        r"b-?\d{2,3}[a-z]?(?:-?bt)?|"
        r"m-?\d{3,4}(?:bt)?|"
        r"x-?\d{1,2}(?:bt)?|"
        r"r-?\d{3}\b|"
        r"solo\s*\d+[a-z]*|"
        r"srs-?[a-z]{2,3}\d{2,4}"
        r")\b",
        cleaned,
    ):
        tok = re.sub(r"[\s-]+", "", m.group(0))
        # Ignore generic tokens like 'a20' or 'x2' unless Microlab/SoundMax
        if len(tok) >= 2:
            found.add(f"code_{tok}")

    return found


def parse_tgdd_loa_dict(obj: dict) -> dict | None:
    if not isinstance(obj, dict):
        return None
    url_rel = str(obj.get("url") or "").strip().lstrip("/")
    code = str(obj.get("productCode") or obj.get("id") or url_rel).strip()
    name = str(obj.get("name") or "").strip()
    if not code or not name or "đĩa than" in name.lower():
        return None

    prices = obj.get("productPrices") or []
    p0 = prices[0] if prices and isinstance(prices[0], dict) else {}
    price = int(round(float(p0.get("price") or 0)))
    is_can_buy = bool(p0.get("isCanBuy", False))
    stock_qty = int(round(float(p0.get("stock") or 0)))
    online_status = int(round(float(p0.get("onlineStatusId") or 0)))
    if price <= 0 or not is_can_buy or stock_qty <= 0 or online_status in (2, 3):
        return None

    brand_obj = obj.get("brand") or {}
    brand_raw = str(brand_obj.get("brandName") or "").strip() if isinstance(brand_obj, dict) else ""
    brand = detect_target_brand(brand_raw, name)
    if not brand:
        return None

    sys_price = int(round(float(p0.get("sysPrice") or 0)))
    disc_pct = int(round(float(p0.get("discountPercent") or 0)))
    if disc_pct <= 0 and sys_price > price > 0:
        disc_pct = int(round((sys_price - price) / sys_price * 100))

    return {
        "compId": "tgdd",
        "compShort": "TGDD",
        "code": code,
        "name": name,
        "brand": brand,
        "price": price,
        "oldPrice": sys_price if sys_price > price else 0,
        "discountPct": disc_pct,
        "inStock": True,
        "sold": str(obj.get("totalSold") or "").strip(),
        "url": f"{TGDD_BASE}/{url_rel}" if url_rel else TGDD_LOA_URL,
    }


def scrape_tgdd_loa() -> list:
    all_prods = {}
    tgdd_api_url = "https://api.thegioididong.com/gw/bus-tgdd-tmdt/api/Cate/GetproductCateV2"
    tgdd_api_hdrs = {
        "Content-Type": "application/json",
        "os": "WebTGDD",
        "siteid": "1",
        "deviceid": "server-cache-12-00-00_24-11-26",
        "platform": "2",
        "provinceid": "1027",
        "Origin": TGDD_BASE,
        "Referer": "https://www.thegioididong.com/loa-laptop",
    }
    for pi in range(15):
        try:
            if pi > 0:
                time.sleep(random.uniform(0.15, 0.35))
            body = {
                "pageIndex": pi,
                "pageSize": 20,
                "provinceId": 1027,
                "urlCate": "loa-laptop",
                "cateId": "69",
                "filters": [],
            }
            raw = fetch_url(
                tgdd_api_url,
                data=json.dumps(body).encode("utf-8"),
                extra_headers=tgdd_api_hdrs,
                unverified_ssl=True,
            )
            prods = (json.loads(raw).get("data") or {}).get("products") or []
            if not prods:
                break
            added = 0
            for raw_obj in prods:
                it = parse_tgdd_loa_dict(raw_obj)
                if it and it["code"] not in all_prods:
                    all_prods[it["code"]] = it
                    added += 1
            print(f"  [TGDD LOA p{pi}] raw={len(prods)}, target_added={added}, total={len(all_prods)}")
        except Exception as exc:
            print(f"  [TGDD LOA p{pi}] error: {exc}")
            break
    return list(all_prods.values())


def scrape_cps_loa() -> list:
    all_prods = {}
    cps_cates = [
        ("112", "loa-bluetooth", CPS_LOA_URL),
        ("2475", "loa-karaoke", CPS_KARAOKE_URL),
    ]
    for cate_id, cate_label, ref_url in cps_cates:
        for page in range(1, 6):
            gql = {
                "query": f"""
                query GetProductsByCateId {{
                  products(
                    filter: {{ static: {{ categories: ["{cate_id}"], province_id: 30, stock: {{ from: 0 }} }}, dynamic: {{}} }}
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
            try:
                raw = fetch_url(
                    CPS_GQL_URL,
                    data=json.dumps(gql).encode("utf-8"),
                    extra_headers={
                        "Content-Type": "application/json",
                        "Origin": "https://cellphones.com.vn",
                        "Referer": ref_url,
                    },
                )
                prods = (json.loads(raw).get("data") or {}).get("products") or []
                added = 0
                for p in prods:
                    g = p.get("general") or {}
                    f = p.get("filterable") or {}
                    pid = str(g.get("product_id") or g.get("sku") or "").strip()
                    name = str(g.get("name") or "").strip()
                    url_path = str(g.get("url_path") or "").strip().lstrip("/")
                    if not pid or not name or pid in all_prods:
                        continue
                    brand = detect_target_brand(str(g.get("manufacturer") or ""), name)
                    if not brand:
                        continue
                    sp = int(round(float(f.get("special_price") or 0)))
                    rp = int(round(float(f.get("price") or 0)))
                    price = sp if sp > 0 else rp
                    old_price = rp if (sp > 0 and rp > sp) else 0
                    disc_pct = int(round((old_price - price) / old_price * 100)) if old_price > price > 0 else 0
                    stock_id = f.get("stock_available_id")
                    comp_stock_id = f.get("company_stock_id")
                    is_listed_active = (stock_id in (46, 56, 152, 4920)) or (comp_stock_id in (46, 56, 152, 4920))
                    if not is_listed_active or price <= 0:
                        continue
                    in_stock = (stock_id == 46) or (comp_stock_id == 46)
                    all_prods[pid] = {
                        "compId": "cps",
                        "compShort": "CPS",
                        "code": pid,
                        "name": name,
                        "brand": brand,
                        "price": price,
                        "oldPrice": old_price,
                        "discountPct": disc_pct,
                        "inStock": in_stock,
                        "sold": "" if in_stock else "Hàng sắp về",
                        "url": f"https://cellphones.com.vn/{url_path}",
                    }
                    added += 1
                print(f"  [CPS {cate_label} page={page}] returned={len(prods)}, target_added={added}, total={len(all_prods)}")
                if len(prods) < 100:
                    break
            except Exception as exc:
                print(f"  [CPS {cate_label} page={page}] error: {exc}")
                break
    return list(all_prods.values())


def scrape_fpt_loa() -> list:
    all_prods = {}
    decoder = json.JSONDecoder()
    brand_urls = [
        (FPT_LOA_URL, "main"),
        (FPT_KARAOKE_URL, "loa-karaoke"),
        (f"{FPT_LOA_URL}/sony", "sony"),
        (f"{FPT_LOA_URL}/marshall", "marshall"),
        (f"{FPT_LOA_URL}/alpha-works", "alpha-works"),
        (f"{FPT_LOA_URL}/microlab", "microlab"),
        (f"{FPT_LOA_URL}/havit", "havit"),
        (f"{FPT_LOA_URL}/soundmax", "soundmax"),
        (f"{FPT_LOA_URL}/tronsmart", "tronsmart"),
    ]
    for url_variant, label in brand_urls:
        try:
            time.sleep(random.uniform(0.15, 0.35))
            html_str = fetch_url(url_variant, unverified_ssl=True)
            joined = extract_next_f_text(html_str)
            added = 0
            for m in re.finditer(r'"totalCount"\s*:\s*\d+', joined):
                pos = joined.rfind("{", max(0, m.start() - 120), m.start())
                if pos == -1:
                    continue
                try:
                    obj, _ = decoder.raw_decode(joined, pos)
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
                    if not code or code in all_prods:
                        continue
                    name = str(s0.get("name") or s0.get("displayName") or it.get("name") or it.get("displayName") or "").strip()
                    brand_raw = str((it.get("brand") or {}).get("name") or "").strip()
                    brand = detect_target_brand(brand_raw, name)
                    if not brand:
                        continue
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
                    all_prods[code] = {
                        "compId": "fpt",
                        "compShort": "FPT",
                        "code": code,
                        "name": name,
                        "brand": brand,
                        "price": price,
                        "oldPrice": old_price,
                        "discountPct": disc_pct,
                        "inStock": in_stock,
                        "sold": "" if in_stock else (status_web or "Hàng sắp về"),
                        "url": f"{FPT_BASE}/{slug}",
                    }
                    added += 1
            print(f"  [FPT LOA {label}] target_added={added}, total={len(all_prods)}")
        except Exception as exc:
            print(f"  [FPT LOA {label}] error: {exc}")
    return list(all_prods.values())


def scrape_hacom_loa() -> list:
    all_prods = {}
    decoder = json.JSONDecoder()
    for base_url, label in ((HACOM_LOA_BT_URL, "loa-bluetooth"), (HACOM_LOA_VT_URL, "loa-vi-tinh")):
        for page in range(1, 5):
            url_variant = base_url if page == 1 else f"{base_url}?page={page}"
            try:
                if page > 1:
                    time.sleep(random.uniform(0.15, 0.35))
                html_str = fetch_url(url_variant, unverified_ssl=True, raw_headers={"User-Agent": "Mozilla/5.0"})
                joined = extract_next_f_text(html_str)
                in_stock_page = 0
                added = 0
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
                    for it in data_list:
                        if not isinstance(it, dict):
                            continue
                        qty = int(round(float(it.get("onhandQuantity") or 0)))
                        cur_p = int(round(float(it.get("unitSellingPrice") or it.get("price1") or 0)))
                        if qty <= 0 or cur_p <= 0:
                            continue
                        in_stock_page += 1
                        code = str(it.get("itemCode") or it.get("itemId") or "").strip()
                        name = str(it.get("itemName") or it.get("shortName") or "").strip()
                        if not code or not name or code in all_prods:
                            continue
                        brand_raw = str(it.get("brand") or "").strip()
                        if brand_raw == "$undefined":
                            brand_raw = ""
                        brand = detect_target_brand(brand_raw, name)
                        if not brand:
                            continue
                        orig_p = int(round(float(it.get("marketPrice") or 0)))
                        old_price = orig_p if orig_p > cur_p else 0
                        disc_pct = int(round((old_price - cur_p) / old_price * 100)) if old_price > cur_p > 0 else 0
                        url_rel = str(it.get("url") or "").strip().lstrip("/")
                        all_prods[code] = {
                            "compId": "hacom",
                            "compShort": "HACOM",
                            "code": code,
                            "name": name,
                            "brand": brand,
                            "price": cur_p,
                            "oldPrice": old_price,
                            "discountPct": disc_pct,
                            "inStock": True,
                            "sold": f"Tồn: {qty}",
                            "url": f"{HACOM_BASE}/{url_rel}" if url_rel else base_url,
                        }
                        added += 1
                print(f"  [HACOM {label} p{page}] in_stock_page={in_stock_page}, target_added={added}, total={len(all_prods)}")
                if in_stock_page == 0:
                    break
            except Exception as exc:
                print(f"  [HACOM {label} p{page}] error: {exc}")
                break
    return list(all_prods.values())


def load_pv_loa() -> list:
    master = json.loads(LOOKUP_MASTER.read_text(encoding="utf-8"))
    report = json.loads(REPORT_DATA.read_text(encoding="utf-8"))

    mpL = master["lookups"]
    subcats = mpL["subcats"]
    subcat3s = mpL["subcat3s"]
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
        sc2 = subcats[r[3]] if r[3] < len(subcats) else ""
        if sc2 != "NH06-03-01-Loa":
            continue
        sc3 = subcat3s[r[4]] if r[4] < len(subcat3s) else ""
        if "đã qua sử dụng" in sc3.lower():
            continue
        name = str(r[1] or "").strip()
        brand_raw = brands[r[5]] if r[5] < len(brands) else ""
        brand = detect_target_brand(brand_raw, name)
        if not brand:
            continue

        status = statuses[r[6]] if r[6] < len(statuses) else ""
        rng = ranges[r[7]] if r[7] < len(ranges) else ""
        listing = listings[r[8]] if r[8] < len(listings) else ""

        pr = prices_map.get(sku)
        cur_p = int(pr[0]) if pr and len(pr) > 0 else 0
        new_p = int(pr[1]) if pr and len(pr) > 1 else 0
        ad_iso = str(pr[2] or "") if pr and len(pr) > 2 else ""
        col17_promo_p = int(pr[3]) if pr and len(pr) > 3 else 0
        col18_promo_p = int(pr[4]) if pr and len(pr) > 4 else 0
        # Prioritize promotion prices from Bao_cao_quan_ly_gia:
        #   1. Col 18 (`Giá KM mới` / `Old promotion price`) if > 0
        #   2. Col 17 (`Giá KM cũ` / `New promotion price`) if > 0
        promo_p = col18_promo_p if col18_promo_p > 0 else col17_promo_p

        is_new_active = new_p > 0 and bool(ad_iso) and ad_iso <= today_iso
        is_new_upcoming = new_p > 0 and bool(ad_iso) and ad_iso > today_iso
        normal_effective = new_p if is_new_active else cur_p
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
            "brand": brand,
            "brandNorm": brand.lower(),
            "driveType": classify_speaker_type(name, sc3),
            "capacity": extract_wattage(name),
            "models": extract_speaker_models(name, brand),
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


def match_speaker_products(comp_prods: list, pv_priced: list) -> tuple:
    matched_by_pv = {}
    unmatched_list = []

    for cp in comp_prods:
        c_brand = cp["brand"]
        c_type = classify_speaker_type(cp["name"])
        c_cap = extract_wattage(cp["name"])
        c_models = extract_speaker_models(cp["name"], c_brand)
        c_colors = extract_colors(cp["name"])
        cp["driveType"] = c_type
        cp["capacity"] = c_cap

        candidates = []
        if c_models:
            for pv in pv_priced:
                if pv["brand"] != c_brand:
                    continue
                overlap = c_models & pv["models"]
                if not overlap:
                    continue
                score = len(overlap) * 120
                for tok in overlap:
                    if not tok.startswith("code_"):
                        score += 80
                    elif len(tok) >= 9:
                        score += 60
                if c_colors and pv["colors"]:
                    score += 40 if (c_colors & pv["colors"]) else -15
                if c_cap and pv["capacity"] and c_cap == pv["capacity"]:
                    score += 25
                if pv["invQty"] > 0:
                    score += 30
                if pv["s30d"] > 0:
                    score += 20
                if pv["listing"].lower() == "active":
                    score += 10
                candidates.append((score, pv))

        candidates.sort(key=lambda x: (x[0], x[1]["invQty"], x[1]["s30d"]), reverse=True)
        if candidates:
            best_score, pv = candidates[0]
            sku = pv["sku"]
            prev = matched_by_pv.get(sku)
            if prev is None:
                matched_by_pv[sku] = (best_score, cp)
            else:
                prev_score, prev_cp = prev
                better = (cp["inStock"] and not prev_cp["inStock"]) or (
                    cp["inStock"] == prev_cp["inStock"]
                    and (best_score > prev_score + 20 or (abs(best_score - prev_score) <= 20 and 0 < cp["price"] < prev_cp["price"]))
                )
                if better:
                    matched_by_pv[sku] = (best_score, cp)
        else:
            unmatched_list.append({
                "compId": cp["compId"],
                "compShort": cp["compShort"],
                "name": cp["name"],
                "brand": c_brand,
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
    print("Scraping multi-competitor SPEAKER prices (LOA — 7 target brands)...")
    tgdd_prods = scrape_tgdd_loa()
    cps_prods = scrape_cps_loa()
    fpt_prods = scrape_fpt_loa()
    hacom_prods = scrape_hacom_loa()
    print(
        f"Scraped target-brand speaker totals: TGDD={len(tgdd_prods)} | CellphoneS={len(cps_prods)} | "
        f"FPT Shop={len(fpt_prods)} | Hacom={len(hacom_prods)}"
    )

    pv_list = load_pv_loa()
    pv_by_sku = {p["sku"]: p for p in pv_list}
    pv_priced = [p for p in pv_list if p["pvPrice"] > 0]
    print(f"PV LOA (7 brands) SKUs: {len(pv_list)} (priced: {len(pv_priced)})")

    tgdd_matched, tgdd_unmatched = match_speaker_products(tgdd_prods, pv_priced)
    cps_matched, cps_unmatched = match_speaker_products(cps_prods, pv_priced)
    fpt_matched, fpt_unmatched = match_speaker_products(fpt_prods, pv_priced)
    hacom_matched, hacom_unmatched = match_speaker_products(hacom_prods, pv_priced)

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

    matrix_rows.sort(key=lambda r: (r["compCount"], r["diffVsBestVnd"]), reverse=True)
    unmatched_rows = tgdd_unmatched + cps_unmatched + fpt_unmatched + hacom_unmatched
    unmatched_rows.sort(key=lambda r: (0 if r["inStock"] else 1, r["compId"], r["brand"], r["price"]))

    both_cnt = sum(1 for r in matrix_rows if r["compCount"] >= 2)
    print(
        f"\nLOA MATRIX SUMMARY: {len(matrix_rows)} unique PV SKUs matched "
        f"(TGDD={len(tgdd_matched)}, CPS={len(cps_matched)}, FPT={len(fpt_matched)}, "
        f"HACOM={len(hacom_matched)}, Multi>=2={both_cnt})"
    )
    for r in matrix_rows[:20]:
        t_str = f"TGDD={r['competitors']['tgdd']['price']:,}" if "tgdd" in r["competitors"] else "TGDD=—"
        c_str = f"CPS={r['competitors']['cps']['price']:,}" if "cps" in r["competitors"] else "CPS=—"
        f_str = f"FPT={r['competitors']['fpt']['price']:,}" if "fpt" in r["competitors"] else "FPT=—"
        h_str = f"HACOM={r['competitors']['hacom']['price']:,}" if "hacom" in r["competitors"] else "HACOM=—"
        print(
            f"  [{r['position']:14s}] {r['pvSku']} {r['pvName'][:32]:32s} | "
            f"PV={r['pvPrice']:>10,} | {t_str:14s} | {c_str:14s} | {f_str:14s} | {h_str:15s} | vsBest={r['diffVsBestVnd']:+,}"
        )

    now_iso = datetime.datetime.now().isoformat(timespec="seconds")
    prev_scraped_at = "2026-11-26T22:00:00"
    window_label = f"Từ 26/11/2026 22:00:00 đến {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')} (55 phút)"

    comp_agent_names = {
        "tgdd": "Trinh Sát TGDĐ → Wall•E Nén Giá",
        "cps": "Trinh Sát CellphoneS → Wall•E Nén Giá",
        "fpt": "Trinh Sát FPT → Wall•E Nén Giá",
        "hacom": "Trinh Sát Hacom → Wall•E Nén Giá",
    }
    price_changes = []
    for r in matrix_rows:
        for cid, cinfo in (r.get("competitors") or {}).items():
            cur_p = int(cinfo.get("price") or 0)
            old_p = int(cinfo.get("oldPrice") or 0)
            if cur_p <= 0:
                continue
            ref_old = old_p if old_p > cur_p else cur_p
            delta_v = cur_p - ref_old
            delta_pct = round((delta_v / ref_old) * 100, 1) if ref_old > 0 else 0.0
            price_changes.append({
                "prevScrapedAt": "26/11/2026 22:00:00",
                "currScrapedAt": datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                "windowLabel": window_label,
                "agentName": comp_agent_names.get(cid, f"Trinh Sát {cid.upper()} → Wall•E"),
                "compId": cid,
                "compShort": cid.upper(),
                "changeType": "price_down" if delta_v < 0 else "new_match",
                "changeTypeLabel": "🔻 Giảm giá KM đối thủ" if delta_v < 0 else "🆕 Trinh sát báo giá Loa",
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
    price_changes.sort(key=lambda x: (x["deltaVnd"], -abs(x["pvVsCompVnd"])))
    price_changes = price_changes[:35]

    payload = {
        "schemaVersion": 2,
        "meta": {
            "categoryKey": "loa",
            "scrapedAt": now_iso,
            "previousScrapedAt": prev_scraped_at,
            "updateWindowLabel": window_label,
            "priceChangeCount": len(price_changes),
            "excelTemplatePath": "update data/so_sanh_gia.xlsx",
            "subcat": "NH06-03-01-Loa (Sony • Alpha Works • Havit • Microlab • SoundMax • Tronsmart • Marshall)",
            "pvTotalCount": len(pv_list),
            "pvPricedCount": len(pv_priced),
            "matrixCount": len(matrix_rows),
            "bothMatchedCount": both_cnt,
            "competitors": [
                {
                    "id": "tgdd",
                    "name": "Thế Giới Di Động",
                    "short": "TGDD",
                    "url": TGDD_LOA_URL,
                    "urls": [TGDD_LOA_URL],
                    "totalCount": len(tgdd_prods),
                    "matchedCount": len(tgdd_matched),
                    "unmatchedCount": len(tgdd_unmatched),
                },
                {
                    "id": "cps",
                    "name": "CellphoneS",
                    "short": "CPS",
                    "url": CPS_LOA_URL,
                    "urls": [CPS_LOA_URL, CPS_KARAOKE_URL],
                    "totalCount": len(cps_prods),
                    "matchedCount": len(cps_matched),
                    "unmatchedCount": len(cps_unmatched),
                },
                {
                    "id": "fpt",
                    "name": "FPT Shop",
                    "short": "FPT",
                    "url": FPT_LOA_URL,
                    "urls": [FPT_LOA_URL, FPT_KARAOKE_URL],
                    "totalCount": len(fpt_prods),
                    "matchedCount": len(fpt_matched),
                    "unmatchedCount": len(fpt_unmatched),
                },
                {
                    "id": "hacom",
                    "name": "Hacom",
                    "short": "HACOM",
                    "url": HACOM_LOA_BT_URL,
                    "urls": [HACOM_LOA_BT_URL, HACOM_LOA_VT_URL],
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
        from enrich_pv_backlinks import PV_LOA_CAT_URL, enrich_payload_with_pv_backlinks, load_backlink_cache, save_backlink_cache
        pv_cache = load_backlink_cache()
        enrich_payload_with_pv_backlinks(payload, PV_LOA_CAT_URL, pv_cache)
        save_backlink_cache(pv_cache)
    except Exception as exc:
        print(f"Warning: could not enrich PV LOA backlinks: {exc}")

    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Saved {OUT_FILE} ({OUT_FILE.stat().st_size / 1024:.1f} KB)")

    try:
        from generate_excel_templates import build_price_compare_excel
        build_price_compare_excel(payload)
    except Exception as exc:
        print(f"Warning: could not write so_sanh_gia.xlsx: {exc}")


if __name__ == "__main__":
    main()
