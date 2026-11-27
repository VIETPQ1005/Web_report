#!/usr/bin/env python3
"""
Wall•E (Phòng Nén Giá PV) — Phong Vũ Backlink Scanner & Enricher.
Scans:
  1. https://phongvu.vn/c/o-cung-di-dong
  2. https://phongvu.vn/c/loa
and resolves exact canonical Phong Vũ product URLs (`https://phongvu.vn/<slug>--s<pvSku>`)
for every matched PV SKU in:
  - `public/data/price_compare_ocgn.json`
  - `public/data/price_compare_loa.json`
Also caches the SKU -> URL mapping in `data/.pv_backlinks_cache.json` and regenerates
`update data/so_sanh_gia.xlsx` & `public/data/so_sanh_gia.xlsx`.
"""

import concurrent.futures
import json
import re
import ssl
import unicodedata
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_FILE = BASE_DIR / "data" / ".pv_backlinks_cache.json"
OCGN_JSON = BASE_DIR / "public" / "data" / "price_compare_ocgn.json"
LOA_JSON = BASE_DIR / "public" / "data" / "price_compare_loa.json"

PV_BASE = "https://phongvu.vn"
PV_OCGN_CAT_URL = f"{PV_BASE}/c/o-cung-di-dong"
PV_LOA_CAT_URL = f"{PV_BASE}/c/loa"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
}


def slugify_vn(name: str, sku: str) -> str:
    s = (name or "").strip().lower()
    s = s.replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if not s:
        s = "san-pham-phong-vu"
    return f"{PV_BASE}/{s}--s{sku}"


def clean_pv_link(raw_link: str, sku: str = "", fallback_name: str = "") -> str:
    if not raw_link:
        return slugify_vn(fallback_name, sku) if sku else PV_BASE
    link = str(raw_link).strip()
    # Strip query params like ?selectPromotionId=... for clean canonical backlink
    link = link.split("?")[0].strip()
    if link.startswith("/"):
        return f"{PV_BASE}{link}"
    if link.startswith("http"):
        return link
    return f"{PV_BASE}/{link.lstrip('/')}"


def load_backlink_cache() -> dict[str, str]:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_backlink_cache(cache: dict[str, str]):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def scrape_pv_category_pages(cat_url: str, max_pages: int = 8) -> dict[str, str]:
    """
    Scrapes __NEXT_DATA__.props.pageProps.serverProducts from a Phong Vũ category URL
    and returns { sku: canonical_pv_url }.
    """
    found: dict[str, str] = {}
    ctx = ssl._create_unverified_context()
    total_pages = max_pages
    page = 1
    while page <= min(total_pages, max_pages):
        url = cat_url if page == 1 else f"{cat_url}?page={page}"
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
            if not m:
                break
            page_props = (json.loads(m.group(1)).get("props") or {}).get("pageProps") or {}
            pag = page_props.get("serverPagination") or {}
            if pag.get("totalPages"):
                total_pages = int(pag["totalPages"])
            sp = page_props.get("serverProducts")
            fp = page_props.get("featuredProducts")
            prods = (sp if isinstance(sp, list) else []) + (fp if isinstance(fp, list) else [])
            added = 0
            for p in prods:
                if not isinstance(p, dict):
                    continue
                sku = str(p.get("sku") or "").strip()
                link = str(p.get("link") or "").strip()
                if sku and link:
                    found[sku] = clean_pv_link(link, sku, p.get("name", ""))
                    added += 1
            # Also catch any href="/...--s<sku>" in raw HTML
            for href_m in re.finditer(r'href="(/[^"]*?--s(\d+))(?:\?[^"]*)?"', html):
                path_part, s_code = href_m.group(1), href_m.group(2)
                if s_code not in found:
                    found[s_code] = f"{PV_BASE}{path_part}"
                    added += 1
            print(f"  [Wall•E PV Scan] {url} -> +{added} SKUs (total={len(found)}, pages={page}/{total_pages})")
            if not prods:
                break
            page += 1
        except Exception as exc:
            print(f"  [Wall•E PV Scan] {url} warning: {exc}")
            break
    return found


def resolve_single_sku_url(sku: str, name: str) -> tuple[str, str]:
    """
    Resolves `https://phongvu.vn/--s{sku}` via HTTP redirect to get the exact canonical URL on phongvu.vn.
    Falls back to deterministic `https://phongvu.vn/<slug>--s{sku}` (which phongvu.vn also routes directly by `--s{sku}`).
    """
    ctx = ssl._create_unverified_context()
    probe_url = f"{PV_BASE}/--s{sku}"
    try:
        req = urllib.request.Request(probe_url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            final_url = resp.geturl().split("?")[0]
            if f"--s{sku}" in final_url:
                return sku, final_url
    except Exception:
        pass
    return sku, slugify_vn(name, sku)


def enrich_payload_with_pv_backlinks(payload: dict, cat_url: str, cache: dict[str, str]) -> int:
    if not payload:
        return 0
    meta = payload.setdefault("meta", {})
    meta["pvCategoryUrl"] = cat_url

    matrix_rows = payload.get("matrixRows") or []
    price_changes = payload.get("priceChanges") or []

    # Collect all PV SKUs that aren't in cache yet
    missing: list[tuple[str, str]] = []
    for r in matrix_rows:
        sku = str(r.get("pvSku") or "").strip()
        if sku and sku not in cache:
            missing.append((sku, str(r.get("pvName") or "")))

    if missing:
        print(f"  [Wall•E PV Backlink] Resolving {len(missing)} remaining SKUs directly via phongvu.vn/--s<SKU>...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            futs = [ex.submit(resolve_single_sku_url, sku, name) for sku, name in missing]
            for fut in concurrent.futures.as_completed(futs):
                s_code, final_u = fut.result()
                cache[s_code] = final_u

    enriched_cnt = 0
    for r in matrix_rows:
        sku = str(r.get("pvSku") or "").strip()
        if not sku:
            continue
        pv_url = cache.get(sku) or slugify_vn(r.get("pvName", ""), sku)
        r["pvUrl"] = pv_url
        enriched_cnt += 1

    for ch in price_changes:
        sku = str(ch.get("pvSku") or "").strip()
        if sku:
            ch["pvUrl"] = cache.get(sku) or slugify_vn(ch.get("productName", ""), sku)

    return enriched_cnt


def main():
    cache = load_backlink_cache()
    print(f"Loaded {len(cache)} cached Phong Vũ SKU backlinks.")

    # 1. Scan category pages requested by user
    print("1. Wall•E scanning https://phongvu.vn/c/o-cung-di-dong ...")
    ocgn_links = scrape_pv_category_pages(PV_OCGN_CAT_URL, max_pages=3)
    cache.update(ocgn_links)

    print("2. Wall•E scanning https://phongvu.vn/c/loa ...")
    loa_links = scrape_pv_category_pages(PV_LOA_CAT_URL, max_pages=3)
    cache.update(loa_links)

    # 2. Enrich OCGN & LOA JSON payloads and resolve any remaining SKUs
    if OCGN_JSON.exists():
        ocgn_data = json.loads(OCGN_JSON.read_text(encoding="utf-8"))
        c1 = enrich_payload_with_pv_backlinks(ocgn_data, PV_OCGN_CAT_URL, cache)
        OCGN_JSON.write_text(json.dumps(ocgn_data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"  -> Enriched {c1} OCGN SKUs in `{OCGN_JSON.name}` with Phong Vũ backlinks.")

    if LOA_JSON.exists():
        loa_data = json.loads(LOA_JSON.read_text(encoding="utf-8"))
        c2 = enrich_payload_with_pv_backlinks(loa_data, PV_LOA_CAT_URL, cache)
        LOA_JSON.write_text(json.dumps(loa_data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"  -> Enriched {c2} LOA SKUs in `{LOA_JSON.name}` with Phong Vũ backlinks.")

    save_backlink_cache(cache)
    print(f"Saved {len(cache)} total Phong Vũ SKU backlinks to `{CACHE_FILE.name}`.")


if __name__ == "__main__":
    main()
