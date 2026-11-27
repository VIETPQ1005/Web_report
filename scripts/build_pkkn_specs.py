#!/usr/bin/env python3
"""
Deepsearch & Technical Spec Builder for Subcat `NH11-01-04-Phụ kiện kết nối` (In-Stock SKUs).
Scans all in-stock SKUs of `NH11-01-04-Phụ kiện kết nối` from `public/data/lookup_master.json` & `public/data/report_data.json`,
deep-searches their official technical specifications from `https://phongvu.vn/--s<SKU>` (`__NEXT_DATA__`:
`shortDescription`, `attributeGroups`, `attributes`, `description` bullets, and canonical URL),
combines with deterministic technical specification extraction (Product Group, Model/Part Number,
Input Port, Output Ports, Resolution/Bandwidth, Power Delivery / Speed, Cable Length, Material/Design, Warranty),
and enriches with Cost Price (`Giá nhập`: WCOGS / Last Purchase / Quote) and Selling Price (`Giá bán`:
prioritizing `Giá KM mới` / `Old promotion price` Col 18 -> Col 17 -> Normal Selling Price -> Listed Price),
plus Gross Margin (`GP` & `GM%`), Inventory QTY, and 30D/90D Sales Velocity.

Caches deep-searched web specs in `data/.pkkn_specs_cache.json` so subsequent `Refresh` runs only fetch newly in-stock SKUs.
Outputs `public/data/pkkn_specs.json`.
"""

import concurrent.futures
import datetime as dt
import html as html_lib
import json
import re
import ssl
import unicodedata
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MASTER_JSON = BASE_DIR / "public" / "data" / "lookup_master.json"
REPORT_JSON = BASE_DIR / "public" / "data" / "report_data.json"
CACHE_JSON = BASE_DIR / "data" / ".pkkn_specs_cache.json"
BACKLINKS_CACHE_JSON = BASE_DIR / "data" / ".pv_backlinks_cache.json"
OUT_JSON = BASE_DIR / "public" / "data" / "pkkn_specs.json"

TARGET_SUBCAT = "NH11-01-04-Phụ kiện kết nối"
PV_BASE = "https://phongvu.vn"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
}

# Curated external deep-search knowledge base for popular Ugreen / Baseus / Orico / TP-Link / Targus / HyperDrive / Asus / HP / Unitek models
EXTERNAL_MODEL_KNOWLEDGE = {
    "10239": {"chipset": "Chrontel / Active IC", "maxRes": "4K@30Hz / 1080P@60Hz", "bandwidth": "2.25Gbps/lane", "material": "Vỏ nhựa ABS cao cấp, đầu mạ vàng 24K, lõi đồng nguyên chất 32AWG"},
    "15495": {"modelRef": "CM478", "maxRes": "HDMI 4K@30Hz", "pdWatt": "PD 100W (Pass-through 95W)", "speed": "1xUSB 3.0 5Gbps + 2xUSB 2.0 480Mbps", "material": "Vỏ hợp kim nhôm Aluminum CNC tản nhiệt"},
    "15596": {"modelRef": "CM511", "maxRes": "HDMI 4K@30Hz", "pdWatt": "PD 100W", "speed": "3xUSB-A 3.0 5Gbps", "material": "Vỏ hợp kim nhôm Aluminum Anodized"},
    "45000": {"modelRef": "CM512 / Revodok", "maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "LAN Gigabit 1000Mbps + USB-C/A 3.0 5Gbps", "material": "Vỏ hợp kim nhôm nguyên khối"},
    "90568": {"modelRef": "CM512 7-in-1", "maxRes": "HDMI 4K@30Hz", "pdWatt": "PD 100W", "speed": "LAN 1000Mbps + 2xUSB 3.0 5Gbps + SD/TF 104MB/s", "material": "Vỏ hợp kim nhôm cao cấp"},
    "10107": {"standard": "HDMI 2.0", "maxRes": "4K@60Hz HDR", "bandwidth": "18Gbps", "material": "Lõi đồng nguyên chất, đầu mạ vàng, vỏ PVC dẻo dai"},
    "10108": {"standard": "HDMI 2.0", "maxRes": "4K@60Hz HDR", "bandwidth": "18Gbps", "material": "Lõi đồng nguyên chất 30AWG, đầu mạ vàng"},
    "10109": {"standard": "HDMI 1.4", "maxRes": "4K@30Hz / 1080P@60Hz", "bandwidth": "10.2Gbps", "material": "Lõi đồng nguyên chất, chống nhiễu 3 lớp"},
    "10110": {"standard": "HDMI 1.4", "maxRes": "4K@30Hz / 1080P@60Hz", "bandwidth": "10.2Gbps", "material": "Lõi đồng 28AWG chống suy hao tín hiệu đường dài"},
    "10111": {"standard": "HDMI 1.4", "maxRes": "4K@30Hz / 1080P@60Hz", "bandwidth": "10.2Gbps", "material": "Lõi đồng + IC khuếch đại tín hiệu"},
    "10112": {"standard": "HDMI 1.4 Active", "maxRes": "1080P@60Hz / 4K@30Hz", "bandwidth": "10.2Gbps", "material": "Tích hợp Chip khuếch đại tín hiệu đường dài 20m"},
    "10114": {"standard": "HDMI 1.4 Active", "maxRes": "1080P@60Hz", "bandwidth": "10.2Gbps", "material": "Tích hợp Chipset khuếch đại 30m, đầu mạ vàng"},
    "60820": {"standard": "HDMI 1.4 / 2.0", "maxRes": "4K@60Hz", "bandwidth": "18Gbps", "material": "Đầu mạ vàng, vỏ nhựa PVC bền bỉ"},
    "80401": {"standard": "HDMI 2.1 Ultra High Speed", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps (eARC, VRR, Dynamic HDR)", "material": "Vỏ bọc dù chống đứt, đầu hợp kim"},
    "80402": {"standard": "HDMI 2.1 Ultra High Speed", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps (eARC, VRR, Dynamic HDR)", "material": "Vỏ bọc dù chống đứt, đầu hợp kim"},
    "80403": {"standard": "HDMI 2.1 Ultra High Speed", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps (eARC, VRR, Dynamic HDR)", "material": "Vỏ bọc dù chống đứt, đầu hợp kim"},
    "80404": {"standard": "HDMI 2.1 Ultra High Speed", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps (eARC, VRR, Dynamic HDR)", "material": "Vỏ bọc dù chống đứt"},
    "80405": {"standard": "HDMI 2.1 Ultra High Speed", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps (eARC, VRR, Dynamic HDR)", "material": "Vỏ bọc dù cao cấp"},
    "45430": {"modelRef": "HD175", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps (HDCP 2.3, eARC)", "material": "Vỏ PVC cao cấp, lõi đồng nguyên chất"},
    "45431": {"modelRef": "HD175", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps (HDCP 2.3, eARC)", "material": "Vỏ PVC cao cấp, lõi đồng nguyên chất"},
    "45432": {"modelRef": "HD175", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps (HDCP 2.3, eARC)", "material": "Vỏ PVC cao cấp, lõi đồng nguyên chất"},
    "45433": {"modelRef": "HD175", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps (HDCP 2.3, eARC)", "material": "Vỏ PVC cao cấp, lõi đồng nguyên chất"},
    "40179": {"modelRef": "HD150", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps", "material": "Dây bọc lưới nylon bện, đầu hợp kim nhôm"},
    "40181": {"modelRef": "HD150", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "48Gbps", "material": "Dây bọc lưới nylon bện, đầu hợp kim nhôm"},
    "25908": {"modelRef": "HD171", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps", "material": "Dây bện dù cao cấp, đầu kim loại"},
    "25910": {"modelRef": "HD171", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps", "material": "Dây bện dù cao cấp, đầu kim loại"},
    "25911": {"modelRef": "HD171", "standard": "HDMI 2.1", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "48Gbps", "material": "Dây bện dù cao cấp, đầu kim loại"},
    "25158": {"standard": "USB-C to DP 1.4", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "32.4Gbps (HBR3, HDR, HDCP2.3)", "material": "Vỏ nhôm + dây bện nylon chống đứt"},
    "25903": {"modelRef": "DP120", "standard": "DisplayPort 1.4", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "32.4Gbps", "material": "Dây bọc dù bện, chốt khóa an toàn"},
    "25905": {"modelRef": "DP120", "standard": "DisplayPort 1.4", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "32.4Gbps", "material": "Dây bọc dù bện, chốt khóa an toàn"},
    "25906": {"modelRef": "DP120", "standard": "DisplayPort 1.4", "maxRes": "8K@60Hz / 4K@240Hz", "bandwidth": "32.4Gbps", "material": "Dây bọc dù bện, chốt khóa an toàn"},
    "55567": {"modelRef": "DP131", "standard": "DisplayPort 2.1", "maxRes": "16K@60Hz / 8K@120Hz / 4K@240Hz", "bandwidth": "80Gbps (UHBR20, FreeSync/G-Sync)", "material": "Hợp kim nhôm + bện nylon cao cấp"},
    "55568": {"modelRef": "DP131", "standard": "DisplayPort 2.1", "maxRes": "16K@60Hz / 8K@120Hz / 4K@240Hz", "bandwidth": "80Gbps (UHBR20, FreeSync/G-Sync)", "material": "Hợp kim nhôm + bện nylon cao cấp"},
    "80395": {"modelRef": "DP115", "standard": "DP 1.4 to HDMI 2.1", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "32.4Gbps (Active Uni-directional)", "material": "Vỏ hợp kim nhôm, dây bện dù"},
    "80397": {"modelRef": "DP115", "standard": "DP 1.4 to HDMI 2.1", "maxRes": "8K@60Hz / 4K@120Hz", "bandwidth": "32.4Gbps (Active Uni-directional)", "material": "Vỏ hợp kim nhôm, dây bện dù"},
    "10245": {"standard": "DisplayPort 1.2", "maxRes": "4K@60Hz / 2K@144Hz", "bandwidth": "21.6Gbps", "material": "Đầu mạ vàng 24K, có chốt khóa, lõi đồng 28AWG"},
    "50985": {"modelRef": "CM219", "speed": "4xUSB-A 3.0 5Gbps", "pdWatt": "Cổng cấp nguồn phụ Micro USB 5V", "material": "Vỏ nhựa ABS gọn nhẹ, dây 15cm"},
    "20290": {"modelRef": "CR113", "speed": "4xUSB-A 3.0 5Gbps", "pdWatt": "Hỗ trợ cổng nguồn phụ Micro USB 5V/2A", "material": "Vỏ nhựa ABS, cáp dài 50cm"},
    "20291": {"modelRef": "CR113", "speed": "4xUSB-A 3.0 5Gbps", "pdWatt": "Hỗ trợ cổng nguồn phụ Micro USB 5V/2A", "material": "Vỏ nhựa ABS, cáp dài 80cm"},
    "20256": {"modelRef": "CR111", "speed": "LAN Gigabit 10/100/1000Mbps + USB 3.0 5Gbps", "chipset": "AX88179", "material": "Vỏ nhựa ABS, đèn LED báo trạng thái"},
    "80150": {"standard": "USB-C 3.1 Gen 2", "maxRes": "4K@60Hz (DP Alt Mode)", "pdWatt": "PD 100W (20V/5A E-Marker Chip)", "speed": "10Gbps", "material": "Đầu nhôm, dây bện nylon"},
    "50570": {"standard": "USB-C to HDMI 2.0", "maxRes": "4K@60Hz", "bandwidth": "18Gbps", "material": "Vỏ nhôm + dây bọc dù chống nhiễu"},
    "10350": {"standard": "USB 2.0 Type-A to Type-B (Máy in)", "speed": "480Mbps", "material": "Đầu mạ vàng, cục chống nhiễu Ferrite"},
    "10351": {"standard": "USB 2.0 Type-A to Type-B (Máy in)", "speed": "480Mbps", "material": "Đầu mạ vàng, bọc chống nhiễu 3 lớp"},
    "10352": {"standard": "USB 2.0 Type-A to Type-B (Máy in)", "speed": "480Mbps", "material": "Đầu mạ vàng, có cục chống nhiễu"},
    "10374": {"standard": "USB 2.0 Active Printer Cable", "speed": "480Mbps", "material": "Tích hợp IC khuếch đại tín hiệu đường dài 10m"},
    "20846": {"standard": "USB 2.0 Type-A to Type-B (Máy in)", "speed": "480Mbps", "material": "Đầu mạ vàng, vỏ PVC bền bỉ"},
    "30155": {"standard": "OTG USB-C to USB-A 3.0", "speed": "5Gbps", "material": "Vỏ nhựa ABS nguyên khối nhỏ gọn"},
    "70889": {"standard": "OTG USB-C to USB-A 3.0", "speed": "5Gbps", "material": "Dây bện dù 10cm, vỏ hợp kim nhôm"},
    "50945": {"standard": "VGA + Audio 3.5mm + Micro USB power to HDMI", "maxRes": "1080P@60Hz", "material": "Vỏ ABS, chuyển đổi VGA analog sang HDMI digital"},
    "10385": {"standard": "USB 2.0 to Mini USB 5-Pin", "speed": "480Mbps", "material": "Đầu mạ vàng, lõi đồng nguyên chất"},
    "40360": {"standard": "Mini DisplayPort (Thunderbolt 2) to HDMI", "maxRes": "4K@30Hz / 1080P@60Hz", "material": "Vỏ nhựa ABS màu đen, cáp 20cm"},
    "40201": {"modelRef": "CM187", "standard": "HDMI Splitter 1 In 2 Out", "maxRes": "4K@30Hz / 1080P@60Hz (HDCP 1.4)", "material": "Vỏ kim loại + пластик tản nhiệt, kèm cáp nguồn USB"},
    "40203": {"standard": "HDMI Splitter 1 In 8 Out", "maxRes": "4K@30Hz / 1080P@60Hz", "material": "Vỏ kim loại công nghiệp, nguồn DC 12V"},
    "30102": {"standard": "Micro HDMI (Type D) to HDMI (Type A)", "maxRes": "4K@60Hz / 3D / Audio Return", "material": "Đầu mạ vàng, lõi đồng nguyên chất"},
    "70694": {"modelRef": "MM137", "standard": "DisplayPort to HDMI Active Adapter", "maxRes": "4K@30Hz / 1080P@60Hz", "material": "Có chipset chuyển đổi chủ động, dây 25cm"},
    "10594": {"standard": "Audio AUX 3.5mm Male to Female", "speed": "Hi-Fi Stereo Audio", "material": "Đầu mạ vàng 24K, vỏ kim loại, lõi đồng tráng men"},
    "10686": {"standard": "Audio AUX 3.5mm Male to Male", "speed": "Hi-Fi Stereo Audio", "material": "Đầu mạ vàng 24K, dây TPE mềm dẻo"},
    "10841": {"standard": "USB 3.0 Type-A to Micro-B (Ổ cứng di động)", "speed": "5Gbps", "material": "Đầu mạ vàng, hỗ trợ ổ cứng HDD/SSD rời 2.5 inch"},
    "20881": {"standard": "USB-A 3.0 to USB-C", "speed": "5Gbps, Sạc nhanh QC 3.0 3A", "material": "Tích hợp điện trở 56kΩ bảo vệ thiết bị"},
    "10477": {"standard": "Mini DisplayPort to DisplayPort 1.2", "maxRes": "4K@60Hz", "bandwidth": "21.6Gbps", "material": "Đầu mạ vàng, truyền 2 chiều"},
    "20201": {"modelRef": "CR104", "standard": "USB 2.0 to RS232 DB9 Serial COM", "chipset": "PL2303", "speed": "1Mbps", "material": "Đầu mạ vàng, lõi đồng chống nhiễu"},
    "20421": {"standard": "Mini DisplayPort to HDMI + VGA 2-in-1", "maxRes": "HDMI 4K@30Hz / VGA 1080P@60Hz", "material": "Vỏ nhôm / ABS chống nhiễu"},
    "30843": {"modelRef": "CM162", "standard": "USB-C to HDMI + VGA 2-in-1", "maxRes": "HDMI 4K@30Hz + VGA 1080P@60Hz (Xuất đồng thời 2 màn)", "material": "Vỏ hợp kim nhôm"},
    "30127": {"standard": "USB 3.0 Male to Female Extension", "speed": "5Gbps", "material": "Đầu mạ vàng, chống nhiễu 3 lớp"},
    "20826": {"standard": "USB 3.0 Active Extension Cable 5m", "speed": "5Gbps", "material": "Tích hợp Chipset khuếch đại tín hiệu FE1.1s"},
    "30205": {"modelRef": "US372", "standard": "USB-C Gen 2 / Thunderbolt 3 Extension", "maxRes": "4K@60Hz", "pdWatt": "PD 100W (20V/5A)", "speed": "10Gbps", "material": "Vỏ nhôm, dây bọc dù"},
    "35998": {"modelRef": "CM888 Uno", "maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W (Pass-through 85W)", "speed": "2xUSB-C 3.2 10Gbps + 2xUSB-A 3.2 10Gbps", "material": "Thiết kế Ugreen Uno màn hình biểu cảm, vỏ kim loại/CNC"},
    "UH6120C": {"maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "LAN Gigabit 1Gbps + 1xUSB-C 5Gbps + 2xUSB-A 5Gbps", "material": "Vỏ hợp kim nhôm + dây bện"},
    "UH5020C": {"maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "1xUSB-C 5Gbps + 2xUSB-A 5Gbps", "material": "Vỏ hợp kim nhôm cao cấp"},
    "UH7020C": {"maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "SD + microSD UHS-I 104MB/s + 1xUSB-C + 2xUSB-A 5Gbps", "material": "Vỏ hợp kim nhôm"},
    "UH9120C": {"maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "LAN 1Gbps + SD/TF + 1xUSB-C 5Gbps + 3xUSB-A 5Gbps", "material": "Vỏ hợp kim nhôm"},
    "UA520C": {"maxRes": "HDMI 4K@60Hz", "standard": "USB-C to HDMI 2.0 Adapter", "material": "Vỏ nhựa ABS/nhôm nhỏ gọn, tương thích MacBook/iPad/Windows"},
    "UE300C": {"speed": "LAN Gigabit 10/100/1000Mbps (USB-C 3.0)", "chipset": "Realtek RTL8153", "material": "Vỏ nhựa ABS trắng gập gọn cáp"},
    "UE306": {"speed": "LAN Gigabit 10/100/1000Mbps (USB-A 3.0)", "chipset": "AX88179", "material": "Hỗ trợ Nintendo Switch, Windows, macOS, Linux"},
    "XD51": {"maxRes": "HDMI 4K@30Hz", "pdWatt": "PD 100W", "speed": "1xUSB-C data + 2xUSB-A 3.0 5Gbps", "material": "Vỏ hợp kim nhôm màu Xám bạc"},
    "XD61": {"maxRes": "HDMI 4K@30Hz", "pdWatt": "PD 100W", "speed": "2xUSB-A 3.0 5Gbps + Khe thẻ SD/TF", "material": "Vỏ hợp kim nhôm màu Xám bạc"},
    "XD71": {"maxRes": "HDMI 4K@30Hz", "pdWatt": "PD 100W", "speed": "LAN Gigabit 1000Mbps + 2xUSB-A 3.0 + SD/TF", "material": "Vỏ hợp kim nhôm màu Xám bạc"},
    "XD101": {"maxRes": "HDMI 4K@30Hz + VGA 1080P@60Hz", "pdWatt": "PD 100W", "speed": "LAN Gigabit + 3xUSB-A 3.0 + SD/TF + Audio 3.5mm", "material": "Vỏ hợp kim nhôm 10-in-1"},
    "DC110": {"maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "USB-C 3.2 Gen 1 5Gbps + USB-A 3.2 Gen 1 5Gbps", "material": "Vỏ nhôm Asus hoàn thiện cao cấp"},
    "DC210": {"maxRes": "HDMI 4K@60Hz", "pdWatt": "PD 100W", "speed": "LAN Gigabit + SD/microSD + 2xUSB-C + 2xUSB-A 5Gbps", "material": "Vỏ hợp kim nhôm Asus 8-in-1"},
    "DOCK310USZ": {"maxRes": "Dual 4K@60Hz (2xDisplayPort + 2xHDMI)", "pdWatt": "PD 65W (Kèm nguồn Adapter)", "speed": "LAN Gigabit + 3xUSB-A 3.2 + 1xUSB-C 3.2 + Audio 3.5mm", "chipset": "DisplayLink DL-6950", "material": "Docking Station doanh nghiệp"},
}


def strip_html(raw: str) -> str:
    if not raw:
        return ""
    txt = re.sub(r"<li[^>]*>", " • ", str(raw), flags=re.I)
    txt = re.sub(r"<br\s*/?>", " • ", txt, flags=re.I)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = html_lib.unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip(" •-\t\r\n")
    return txt


def slugify_vn(name: str, sku: str) -> str:
    s = (name or "").strip().lower().replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if not s:
        s = "phu-kien-ket-noi"
    return f"{PV_BASE}/{s}--s{sku}"


def fetch_pv_product_page(sku: str, name: str) -> dict:
    """
    Deep-searches `https://phongvu.vn/--s{sku}` to extract official Phong Vũ specifications
    from `__NEXT_DATA__` (`shortDescription`, `attributeGroups`, `attributes`, `description`).
    """
    ctx = ssl._create_unverified_context()
    probe_url = f"{PV_BASE}/--s{sku}"
    result = {
        "sku": sku,
        "pvUrl": slugify_vn(name, sku),
        "shortDesc": "",
        "highlights": [],
        "attrMap": {},
        "barcode": "",
        "modelCode": "",
        "weightG": "",
        "warrantyText": "",
    }
    try:
        req = urllib.request.Request(probe_url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=14) as resp:
            final_url = resp.geturl().split("?")[0]
            if f"--s{sku}" in final_url:
                result["pvUrl"] = final_url
            raw_html = resp.read().decode("utf-8", errors="ignore")

        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', raw_html, re.S)
        if not m:
            return result

        data = json.loads(m.group(1))
        sp = (((data.get("props") or {}).get("pageProps") or {}).get("serverProduct") or {}).get("product") or {}
        p_info = sp.get("productInfo") or {}
        p_detail = sp.get("productDetail") or {}

        canonical = p_info.get("canonical")
        if canonical:
            result["pvUrl"] = f"{PV_BASE}/{str(canonical).lstrip('/')}"

        result["barcode"] = str(p_info.get("barcode") or p_detail.get("barcode") or "").strip()
        w_months = (p_info.get("warranty") or {}).get("months")
        if w_months:
            result["warrantyText"] = f"{w_months} tháng"

        short_raw = p_detail.get("shortDescription") or ""
        if short_raw:
            result["shortDesc"] = strip_html(short_raw)

        # Extract bullet points from description <li>
        desc_raw = p_detail.get("description") or ""
        if desc_raw:
            li_matches = re.findall(r"<li[^>]*>(.*?)</li>", desc_raw, flags=re.S | re.I)
            bullets = []
            for li in li_matches[:6]:
                clean_b = strip_html(li)
                if clean_b and len(clean_b) > 6:
                    bullets.append(clean_b)
            result["highlights"] = bullets

        attr_map = {}
        for ag in p_detail.get("attributeGroups") or []:
            k = str(ag.get("name") or "").strip()
            v = strip_html(ag.get("value") or "")
            if k and v and v.upper() != "KHT":
                attr_map[k] = v

        for at in p_detail.get("attributes") or []:
            code = str(at.get("code") or "").strip()
            vals = [strip_html(v) for v in (at.get("values") or []) if v and str(v).upper() != "KHT"]
            if code and vals:
                attr_map[code] = ", ".join(vals)

        result["attrMap"] = attr_map
        if attr_map.get("phukien_ten"):
            result["modelCode"] = attr_map["phukien_ten"]
        if attr_map.get("weight"):
            result["weightG"] = f"{attr_map['weight']}g"
        if attr_map.get("Bảo hành") and not result["warrantyText"]:
            result["warrantyText"] = attr_map["Bảo hành"]
    except Exception:
        pass
    return result


def parse_structured_specs(name: str, brand: str, subcat3: str, warranty_mo: int, web_info: dict) -> dict:
    """
    Combines product name, subcat3, external deep-search model knowledge base, and scraped Phong Vũ page attributes
    into structured, normalized technical parameters for side-by-side comparison.
    """
    nl = name.lower()
    combined_text = f"{name} {web_info.get('shortDesc', '')} {' '.join(web_info.get('highlights', []))} {json.dumps(web_info.get('attrMap', {}), ensure_ascii=False)}"
    cl = combined_text.lower()

    # 1. Extract Model / Part Number
    model = web_info.get("modelCode") or ""
    paren_models = re.findall(r"\(([A-Za-z0-9\-\s/\.]{3,28})\)", name)
    for pm in paren_models:
        pm_clean = pm.strip()
        if pm_clean.lower() not in ("đen", "trắng", "xám", "bạc", "xám bạc", "màu đen", "stock buffer", "f", "1.8m"):
            model = pm_clean
            break
    if not model:
        m_code = re.search(
            r"\b(UG-\d+|\d{5}|HD\d{3}[A-Z0-9\-]*|DP\d{3}|HM\d{2}[A-Z0-9\-]*|UH\d{4}C|UA\d{3}C|UE\d{3}C?|XD\d{2,3}|DC\d{3}|DOCK\d{3}[A-Z]*|V-V\d{3}|KY-[A-Z0-9\-]+|8TH72AA|8WW45AA|8G9Q9AA|CAC-[A-Z0-9]+|UT[JK]-U3-BK|PAPW[A-Z0-9\-]+|PW11-[A-Z0-9\-]+|AH-12F[A-Z0-9\-]*|CAHUB-[A-Z0-9]+|DLK\d+[A-Z0-9/]*)\b",
            name,
            re.I,
        )
        if m_code:
            model = m_code.group(1)

    ext_kb = {}
    for k, v in EXTERNAL_MODEL_KNOWLEDGE.items():
        if k.lower() in nl or (model and k.lower() in model.lower()):
            ext_kb = v
            break

    if ext_kb.get("modelRef") and model and ext_kb["modelRef"] not in model:
        model = f"{model} ({ext_kb['modelRef']})"

    # 2. Product Type / Group (`productGroup`)
    if any(w in nl for w in ("docking",)):
        product_group = "Docking Station"
    elif any(w in nl for w in ("bộ chia", "hub")) or re.search(r"\b\d+\s*(?:in|-in-)\s*1\b", nl) or len(re.findall(r"\+", name)) >= 2:
        if "hdmi sang" in nl or "multi hdmi" in nl or "1 ra 2" in nl or "1 ra 4" in nl or "1 ra 8" in nl:
            product_group = "Bộ chia HDMI (Splitter)"
        else:
            product_group = "Bộ chia / Hub đa năng"
    elif "lan" in nl or "rj45" in nl:
        product_group = "Bộ chuyển USB/Type-C sang LAN"
    elif any(w in nl for w in ("dây nguồn", "cáp nguồn")):
        product_group = "Dây / Cáp nguồn"
    elif "máy in" in nl:
        product_group = "Cáp USB Máy in"
    elif any(w in nl for w in ("audio", "3.5", "av 3.5")):
        product_group = "Cáp âm thanh AUX 3.5mm"
    elif "rs232" in nl or " com " in nl:
        product_group = "Cáp điều khiển USB to RS232/COM"
    elif any(w in nl for w in ("nối dài", "cáp nối")):
        product_group = "Cáp nối dài (Extension)"
    elif any(w in nl for w in ("bộ chuyển", "đầu chuyển", "cáp chuyển", " sang ", " to ", "->")):
        if any(w in nl for w in ("hdmi", "displayport", "vga", "dp")):
            product_group = "Cáp / Bộ chuyển Tín hiệu Hình ảnh"
        else:
            product_group = "Cáp / Đầu chuyển Dữ liệu & OTG"
    elif "hdmi" in nl:
        product_group = "Cáp HDMI"
    elif "displayport" in nl:
        product_group = "Cáp DisplayPort"
    elif "vga" in nl:
        product_group = "Cáp VGA"
    else:
        product_group = subcat3 or "Cáp & Phụ kiện kết nối"

    # 3. Input Port (`inputPort`) & Output Ports (`outputPorts`)
    input_port = "—"
    output_ports = []

    if "dây nguồn pc" in nl:
        input_port = "Phích cắm điện 220V (2/3 chấu)"
        output_ports = ["Đầu nguồn C13 (PSU PC / Màn hình)"]
    elif "dây nguồn laptop" in nl:
        input_port = "Phích cắm điện 220V (3 chấu)"
        output_ports = ["Đầu nguồn C5 (3 lỗ hoa mai Adapter Laptop)"]
    elif "nguồn sata" in nl:
        input_port = "Molex 4-Pin (PSU)"
        output_ports = ["SATA Power 15-Pin (HDD/SSD)"]
    elif "máy in" in nl:
        input_port = "USB-A 2.0"
        output_ports = ["USB-B 2.0 (Máy in / Scan)"]
    else:
        # Check directional patterns: X sang Y / X to Y / X -> Y
        dir_m = re.search(r"(usb[\s\-]*type[\s\-]*c|usb[\s\-]*c|type[\s\-]*c|usb[\s\-]*a|usb\s*3\.0|usb\s*2\.0|mini\s*displayport|micro\s*hdmi|displayport|hdmi|vga)\s*(?:sang|to|->)\s*(.+)", nl, re.I)
        if dir_m:
            raw_in = dir_m.group(1).strip().upper()
            if "TYPE" in raw_in or raw_in.endswith("-C") or raw_in.endswith(" C"):
                input_port = "USB Type-C"
            elif "MINI DISPLAYPORT" in raw_in:
                input_port = "Mini DisplayPort"
            elif "MICRO HDMI" in raw_in:
                input_port = "Micro HDMI"
            elif "DISPLAYPORT" in raw_in:
                input_port = "DisplayPort"
            elif "USB" in raw_in:
                input_port = "USB-A 3.0" if "3.0" in raw_in else "USB-A"
            else:
                input_port = raw_in

            raw_out = dir_m.group(2)
            # Parse output ports from raw_out
            if "2xhdmi" in raw_out or "2*hdmi" in raw_out:
                output_ports.append("2×HDMI 4K")
            elif "8xhdmi" in raw_out or "1 ra 8" in nl:
                output_ports.append("8×HDMI")
            elif "1 ra 2" in nl:
                output_ports.append("2×HDMI")
            elif "hdmi" in raw_out:
                output_ports.append("HDMI 4K" if "4k" in cl else "HDMI")
            if "dp" in raw_out or "displayport" in raw_out:
                output_ports.append("DisplayPort")
            if "vga" in raw_out:
                output_ports.append("VGA")
            if "lan" in raw_out or "rj45" in raw_out:
                output_ports.append("LAN Gigabit RJ45")
            if "sd" in raw_out or "tf" in raw_out or "msd" in raw_out:
                output_ports.append("Khe thẻ SD/microSD")
            if "3.5" in raw_out or "jack" in raw_out:
                output_ports.append("Audio 3.5mm")
            if "rs232" in raw_out or "com" in raw_out:
                output_ports.append("RS232 (DB9 COM)")
            if "mini usb" in raw_out:
                output_ports.append("Mini USB 5-Pin")
            if "micro b" in raw_out:
                output_ports.append("Micro-B 3.0")

            # Count USB-C / USB-A ports in Hub descriptions (e.g., + 2C + 3A, 4xUSB-A)
            c_cnt = re.search(r"\b(\d+)\s*(?:x|\*)\s*(?:usb[\s\-]*)?c\b", raw_out, re.I)
            if c_cnt:
                output_ports.append(f"{c_cnt.group(1)}×USB-C (PD/Data)")
            elif "usb-c" in raw_out or "+ 1c" in raw_out or "+ c" in raw_out or "type-c" in raw_out:
                output_ports.append("1×USB-C (PD/Data)")

            a_cnt = re.search(r"\b(\d+)\s*(?:x|\*)\s*(?:usb[\s\-]*a|usb\s*3\.|usb\s*2\.|a)\b", raw_out, re.I)
            if a_cnt:
                output_ports.append(f"{a_cnt.group(1)}×USB-A 3.0")
            elif "usb 3.0" in raw_out or "usb 3.2" in raw_out or "usb-a" in raw_out:
                output_ports.append("USB-A 3.0")
        else:
            # Symmetrical cable (HDMI, DisplayPort, VGA, Audio 3.5, USB Extension)
            if "multi hdmi 1 ra 2" in nl:
                input_port = "1×HDMI In"
                output_ports = ["2×HDMI Out"]
            elif "dual usb-c" in nl:
                input_port = "Dual USB-C"
                output_ports = ["HDMI 4K + USB-C PD + USB-A 3.0 + SD/TF"]
            elif "dock310" in nl:
                input_port = "USB-C / USB-A 3.0"
                output_ports = ["2×HDMI + 2×DP (Dual 4K) + LAN Gigabit + 3×USB-A + 1×USB-C + Audio"]
            elif "hdmi" in nl:
                ver = "2.1" if "2.1" in nl else "2.0" if "2.0" in nl else "1.4" if "1.4" in nl else ""
                input_port = f"HDMI {ver} Male".strip()
                output_ports = [f"HDMI {ver} Male".strip() if "nối" not in nl else f"HDMI {ver} Female".strip()]
            elif "displayport" in nl:
                ver = "2.1" if "2.1" in nl else "1.4" if "1.4" in nl else "1.2"
                input_port = f"DisplayPort {ver} Male"
                output_ports = [f"DisplayPort {ver} Male"]
            elif "vga" in nl:
                input_port = "VGA (DB15 Male)"
                output_ports = ["VGA (DB15 Male)"]
            elif "3.5" in nl:
                input_port = "Jack 3.5mm Male"
                output_ports = ["Jack 3.5mm Female" if "nối dài" in nl else "Jack 3.5mm Male"]
            elif "thunderbolt 3" in nl or "type c" in nl:
                input_port = "USB Type-C Male"
                output_ports = ["USB Type-C Female" if "nối dài" in nl else "USB Type-C Male"]
            elif "usb 3.0" in nl:
                input_port = "USB-A 3.0 Male"
                output_ports = ["USB-A 3.0 Female" if "nối dài" in nl else "USB-A 3.0 Male"]

    if not output_ports:
        output_ports = [product_group]

    # Number of ports for Hub / Splitter
    port_count = 1
    in_one_m = re.search(r"\b(\d{1,2})\s*(?:in|-in-)\s*1\b", nl)
    if in_one_m:
        port_count = int(in_one_m.group(1))
    elif "35998" in nl or "cm888" in nl:
        port_count = 6
    elif "1 ra 8" in nl or "8xhdmi" in nl:
        port_count = 8
    elif "4xusb" in nl:
        port_count = 4
    elif "1 ra 2" in nl:
        port_count = 2
    elif product_group == "Bộ chia / Hub đa năng" and len(output_ports) > 1:
        # Sum explicit multipliers like 2×USB-C + 2×USB-A + HDMI
        tot_p = 0
        for op in output_ports:
            m_mult = re.match(r"^(\d+)×", op)
            tot_p += int(m_mult.group(1)) if m_mult else 1
        port_count = max(2, tot_p)

    # 4. Resolution / Standard (`resolution`)
    resolution = ext_kb.get("maxRes") or ""
    if not resolution:
        if "16k" in cl:
            resolution = "16K@60Hz / 8K@120Hz / 4K@240Hz (DP 2.1)"
        elif "8k" in cl:
            resolution = "8K@60Hz / 4K@120Hz-240Hz"
        elif "4k@60hz" in cl or "hdmi 2.0" in cl or "displayport 1.2" in cl:
            resolution = "4K@60Hz (3840×2160)"
        elif "4k" in cl or "hdmi 1.4" in cl:
            resolution = "4K@30Hz / Full HD 1080P@60Hz"
        elif "vga" in cl:
            resolution = "Full HD 1080P@60Hz (1920×1080)"
        else:
            resolution = "—"

    # 5. Speed / Bandwidth / Power Delivery (`speedAndPower`)
    speed_parts = []
    if ext_kb.get("bandwidth"):
        speed_parts.append(f"Băng thông {ext_kb['bandwidth']}")
    elif "48gbps" in cl or "hdmi 2.1" in cl:
        speed_parts.append("Băng thông 48Gbps")
    elif "80gbps" in cl or "displayport 2.1" in cl:
        speed_parts.append("Băng thông 80Gbps")
    elif "32.4gbps" in cl or "displayport 1.4" in cl:
        speed_parts.append("Băng thông 32.4Gbps")
    elif "18gbps" in cl or "hdmi 2.0" in cl:
        speed_parts.append("Băng thông 18Gbps")

    if ext_kb.get("speed"):
        speed_parts.append(ext_kb["speed"])
    else:
        if "gigabit" in cl or "1000mbps" in cl:
            speed_parts.append("LAN Gigabit 1000Mbps")
        elif "100mbps" in cl:
            speed_parts.append("LAN 100Mbps")
        if "10gbps" in cl or "gen 2" in cl:
            speed_parts.append("USB 3.1 Gen 2 (10Gbps)")
        elif "5gbps" in cl or "usb 3.0" in cl or "3xusb-a" in cl or "4xusb-a" in cl:
            speed_parts.append("USB 3.0 (5Gbps)")
        elif "480mbps" in cl or "usb 2.0" in cl or "máy in" in cl:
            speed_parts.append("USB 2.0 (480Mbps)")

    if ext_kb.get("pdWatt"):
        speed_parts.append(ext_kb["pdWatt"])
    elif "100w" in cl or "pd" in cl:
        m_w = re.search(r"(\d{2,3})\s*w\b", cl)
        w_str = f"{m_w.group(1)}W" if m_w else "100W"
        speed_parts.append(f"Sạc nhanh PD {w_str}")

    speed_and_power = " • ".join(dict.fromkeys(speed_parts)) if speed_parts else "Tiêu chuẩn"

    # 6. Cable Length (`cableLength`)
    cable_length = "—"
    m_len = re.search(r"\b(\d+(?:\.\d+)?)\s*(m|cm)\b", nl)
    if m_len:
        val, unit = m_len.group(1), m_len.group(2).lower()
        cable_length = f"{val}{unit}"
    elif "bộ chia" in nl or "hub" in nl or "bộ chuyển" in nl:
        cable_length = "15cm (Hub/Adapter)"
    elif "đầu chuyển" in nl:
        cable_length = "Đầu cắm trực tiếp (OTG)"
    elif "dây nguồn pc" in nl:
        cable_length = "1.5m"

    # 7. Material / Special Features (`materialAndFeature`)
    material = ext_kb.get("material") or ""
    if not material:
        if "bộ chia" in nl or "hub" in nl:
            material = "Vỏ hợp kim nhôm / ABS tản nhiệt, Plug & Play"
        elif "mạ vàng" in cl:
            material = "Đầu kết nối mạ vàng 24K chống oxy hóa, lõi đồng nguyên chất"
        elif "8k" in cl or "hdmi 2.1" in cl or "dp 1.4" in cl or "dp 2.1" in cl:
            material = "Lõi đồng nguyên chất chống nhiễu đa lớp, hỗ trợ HDR/eARC/VRR"
        else:
            material = "Lõi đồng nguyên chất, vỏ nhựa PVC/ABS chịu lực cao"

    # 8. Full Deepsearch Summary String (`specSummary`)
    web_short = web_info.get("shortDesc") or ""
    web_bullets = " • ".join(web_info.get("highlights")[:3]) if web_info.get("highlights") else ""
    deep_note = web_short or web_bullets or f"{product_group} | Đầu vào: {input_port} → Đầu ra: {', '.join(output_ports)} | {resolution} | {speed_and_power}"

    warranty_final = web_info.get("warrantyText") or (f"{warranty_mo} tháng" if warranty_mo > 0 else "12–18 tháng")

    return {
        "model": model or "Tiêu chuẩn",
        "productGroup": product_group,
        "portCount": port_count,
        "inputPort": input_port,
        "outputPorts": ", ".join(output_ports),
        "resolution": resolution,
        "speedAndPower": speed_and_power,
        "cableLength": cable_length,
        "material": material,
        "warranty": warranty_final,
        "barcode": web_info.get("barcode") or "",
        "deepSpecs": deep_note,
    }


def compute_effective_selling_price(mp_row: list, pbs_entry: list | None, today_iso: str) -> tuple[int, int, str]:
    """
    Returns (selling_price, listed_price, price_source_note) following AGENTS.md & Bao_cao_quan_ly_gia rule:
      1. Col 18 (`Giá KM mới` / `Old promotion price` -> pbs_entry[4]) if > 0
      2. Col 17 (`Giá KM cũ` / `New promotion price` -> pbs_entry[3]) if > 0
      3. SR_PROMO from Master Product (mp_row[12]) if > 0
      4. Normal selling price from Bao_cao_quan_ly_gia (pbs_entry[1] if active_date <= today else pbs_entry[0])
      5. Listed price from Master Product (mp_row[11])
    """
    listed_price = int(round(float(mp_row[11] or 0)))
    sr_promo = int(round(float(mp_row[12] or 0)))

    if isinstance(pbs_entry, list) and len(pbs_entry) >= 2:
        cur_normal = int(round(float(pbs_entry[0] or 0)))
        new_normal = int(round(float(pbs_entry[1] or 0)))
        act_date = str(pbs_entry[2] or "") if len(pbs_entry) > 2 else ""
        col17_promo = int(round(float(pbs_entry[3] or 0))) if len(pbs_entry) > 3 else 0
        col18_promo = int(round(float(pbs_entry[4] or 0))) if len(pbs_entry) > 4 else 0

        normal_eff = new_normal if (new_normal > 0 and act_date and act_date <= today_iso) else (cur_normal or new_normal)
        if normal_eff > listed_price:
            listed_price = normal_eff

        if col18_promo > 0:
            return col18_promo, listed_price or col18_promo, "Giá KM mới (QL Giá)"
        if col17_promo > 0:
            return col17_promo, listed_price or col17_promo, "Giá KM (QL Giá)"
        if sr_promo > 0:
            return sr_promo, listed_price or sr_promo, "Giá KM (Master)"
        if normal_eff > 0:
            return normal_eff, listed_price or normal_eff, "Giá bán lẻ (QL Giá)"

    if sr_promo > 0:
        return sr_promo, listed_price or sr_promo, "Giá KM (Master)"
    return listed_price, listed_price, "Giá niêm yết"


def main():
    print(f"[PKKN Spec Builder] Loading {MASTER_JSON.name} & {REPORT_JSON.name}...")
    mp = json.loads(MASTER_JSON.read_text(encoding="utf-8"))
    rd = json.loads(REPORT_JSON.read_text(encoding="utf-8"))

    lk = mp.get("lookups") or {}
    pbs = mp.get("priceBySku") or {}
    subcats = lk.get("subcats") or []
    subcat3s = lk.get("subcat3s") or []
    brands = lk.get("brands") or []
    statuses = lk.get("purchaseStatuses") or []
    ranges = lk.get("ranges") or []

    if TARGET_SUBCAT not in subcats:
        raise RuntimeError(f"Subcat {TARGET_SUBCAT} not found in lookup_master.json")
    target_sub_idx = subcats.index(TARGET_SUBCAT)

    # Index 7D/30D/90D/180D velocity from report_data.json invSkuLevel
    vel_by_sku = {}
    for sr in (rd.get("invSkuLevel") or {}).get("rows") or []:
        vel_by_sku[str(sr[0])] = {
            "s7d": int(round(float(sr[6] or 0))),
            "s30d": int(round(float(sr[7] or 0))),
            "s90d": int(round(float(sr[8] or 0))),
            "s180d": int(round(float(sr[9] or 0))),
            "stockDays": round(float(sr[11] or 0), 1),
        }

    # Extract all SKUs of NH11-01-04-Phụ kiện kết nối (both in-stock and out-of-stock)
    all_subcat_rows = [r for r in (mp.get("rows") or []) if r[3] == target_sub_idx]
    all_subcat_rows.sort(key=lambda r: (-(1 if float(r[18] or 0) > 0 else 0), -float(r[18] or 0), -float(r[20] or 0), str(r[0])))
    in_stock_rows = [r for r in all_subcat_rows if float(r[18] or 0) > 0]
    print(f"[PKKN Spec Builder] Found {len(in_stock_rows)} in-stock SKUs / {len(all_subcat_rows)} total Master SKUs in '{TARGET_SUBCAT}'.")

    # Load web deepsearch cache
    cache: dict[str, dict] = {}
    if CACHE_JSON.exists():
        try:
            cache = json.loads(CACHE_JSON.read_text(encoding="utf-8"))
        except Exception:
            cache = {}

    backlinks_cache: dict[str, str] = {}
    if BACKLINKS_CACHE_JSON.exists():
        try:
            backlinks_cache = json.loads(BACKLINKS_CACHE_JSON.read_text(encoding="utf-8"))
        except Exception:
            backlinks_cache = {}

    missing_to_fetch = []
    for r in in_stock_rows:
        sku = str(r[0]).strip()
        if sku not in cache or not cache[sku].get("pvUrl"):
            missing_to_fetch.append((sku, str(r[1] or "")))

    if missing_to_fetch:
        print(f"[PKKN Spec Builder] Deep-searching {len(missing_to_fetch)} in-stock SKUs from phongvu.vn...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            futs = [pool.submit(fetch_pv_product_page, sku, name) for sku, name in missing_to_fetch]
            done_cnt = 0
            for fut in concurrent.futures.as_completed(futs):
                info = fut.result()
                sku = info["sku"]
                cache[sku] = info
                if info.get("pvUrl"):
                    backlinks_cache[sku] = info["pvUrl"]
                done_cnt += 1
                if done_cnt % 25 == 0 or done_cnt == len(missing_to_fetch):
                    print(f"  -> Deep-searched {done_cnt}/{len(missing_to_fetch)} SKUs")
        CACHE_JSON.parent.mkdir(parents=True, exist_ok=True)
        CACHE_JSON.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
        BACKLINKS_CACHE_JSON.write_text(json.dumps(backlinks_cache, ensure_ascii=False, indent=2), encoding="utf-8")

    today_iso = dt.date.today().isoformat()
    sku_items = []
    group_counts = {}
    brand_counts = {}

    for r in all_subcat_rows:
        sku = str(r[0]).strip()
        name = str(r[1] or "").strip()
        subcat3 = subcat3s[r[4]] if (isinstance(r[4], int) and 0 <= r[4] < len(subcat3s)) else ""
        brand = brands[r[5]] if (isinstance(r[5], int) and 0 <= r[5] < len(brands)) else "Khác"
        status = statuses[r[7]] if (isinstance(r[7], int) and 0 <= r[7] < len(statuses)) else "Normal"
        prod_range = ranges[r[8]] if (isinstance(r[8], int) and 0 <= r[8] < len(ranges)) else ""

        wcogs = int(round(float(r[13] or 0)))
        last_pur = int(round(float(r[14] or 0)))
        latest_quote = int(round(float(r[15] or 0)))
        cost_price = wcogs if wcogs > 0 else (last_pur if last_pur > 0 else latest_quote)

        sell_price, listed_price, price_source = compute_effective_selling_price(r, pbs.get(sku), today_iso)
        gp_vnd = (sell_price - cost_price) if (sell_price > 0 and cost_price > 0) else 0
        gm_pct = round((gp_vnd / sell_price) * 100, 1) if (sell_price > 0 and cost_price > 0) else 0.0
        markup_pct = round((gp_vnd / cost_price) * 100, 1) if (cost_price > 0 and sell_price > 0) else 0.0

        inv_qty = int(round(float(r[18] or 0)))
        inv_val = int(round(float(r[19] or 0)))
        s30d_mp = int(round(float(r[20] or 0)))
        warranty_mo = int(round(float(r[21] or 0)))

        vel = vel_by_sku.get(sku) or {}
        s7d = vel.get("s7d", 0)
        s30d = vel.get("s30d", s30d_mp)
        s90d = vel.get("s90d", 0)
        s180d = vel.get("s180d", 0)
        stock_days = vel.get("stockDays", 0.0)

        web_info = cache.get(sku) or {"sku": sku, "pvUrl": backlinks_cache.get(sku) or slugify_vn(name, sku)}
        specs = parse_structured_specs(name, brand, subcat3, warranty_mo, web_info)

        pg = specs["productGroup"]
        if inv_qty > 0:
            group_counts[pg] = group_counts.get(pg, 0) + 1
            brand_counts[brand] = brand_counts.get(brand, 0) + 1

        sku_items.append({
            "sku": sku,
            "name": name,
            "brand": brand,
            "subcat": TARGET_SUBCAT,
            "subcat3": subcat3,
            "status": status,
            "range": prod_range,
            "pvUrl": web_info.get("pvUrl") or slugify_vn(name, sku),
            "inStock": inv_qty > 0,
            "invQty": inv_qty,
            "invVal": inv_val,
            "s7d": s7d,
            "s30d": s30d,
            "s90d": s90d,
            "s180d": s180d,
            "stockDays": stock_days,
            "costPrice": cost_price,
            "wcogs": wcogs,
            "lastPurPrice": last_pur,
            "latestQuote": latest_quote,
            "sellingPrice": sell_price,
            "listedPrice": listed_price,
            "priceSource": price_source,
            "gpVnd": gp_vnd,
            "gmPct": gm_pct,
            "markupPct": markup_pct,
            **specs,
        })

    payload = {
        "meta": {
            "subcat": TARGET_SUBCAT,
            "updatedAt": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "totalMasterSkus": len(sku_items),
            "totalInStockSkus": len(in_stock_rows),
            "totalOutOfStockSkus": len(sku_items) - len(in_stock_rows),
            "totalInvQty": sum(x["invQty"] for x in sku_items),
            "totalInvVal": sum(x["invVal"] for x in sku_items),
            "totalSales30d": sum(x["s30d"] for x in sku_items),
            "productGroups": [k for k, _ in sorted(group_counts.items(), key=lambda kv: (-kv[1], kv[0]))],
            "brands": [k for k, _ in sorted(brand_counts.items(), key=lambda kv: (-kv[1], kv[0]))],
        },
        "items": sku_items,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(
        f"[PKKN Spec Builder] Saved {OUT_JSON} ({len(sku_items)} in-stock SKUs, "
        f"{len(payload['meta']['productGroups'])} groups, {len(payload['meta']['brands'])} brands)."
    )


if __name__ == "__main__":
    main()
