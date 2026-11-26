#!/usr/bin/env python3
"""
Local Static + Excel Form Update HTTP Server for PHONG VŨ // ACCY BI Command Dashboard.
Serves `public/` at http://localhost:8080 and exposes:
  - GET  /api/scan-status         : Checks whether local Python ETL & scraper are available
  - POST /api/scan-prices         : Runs `scripts/scrape_tgdd_ocgn.py` (4 Scouts -> Wall•E -> so_sanh_gia.xlsx) and returns fresh JSON
  - POST /api/upload-update-data  : Accepts raw binary `.xlsx` upload of `update_data.xlsx`, saves to `update data/update_data.xlsx`,
                                    runs `build_data.py --update-excel`, and returns fresh `report_data.json`
  - POST /api/upload-price-excel  : Accepts JSON or binary `.xlsx` from `so_sanh_gia.xlsx` to persist price updates
  - GET  /api/download-template   : Downloads `update data/update_data.xlsx` or `update data/so_sanh_gia.xlsx`
"""

import http.server
import json
import subprocess
import sys
import threading
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
UPDATE_DATA_DIR = BASE_DIR / "update data"
SCRAPER_SCRIPT = BASE_DIR / "scripts" / "scrape_tgdd_ocgn.py"
BUILD_SCRIPT = BASE_DIR / "scripts" / "build_data.py"
PRICE_JSON = PUBLIC_DIR / "data" / "price_compare_ocgn.json"
REPORT_JSON = PUBLIC_DIR / "data" / "report_data.json"

_scan_lock = threading.Lock()
_etl_lock = threading.Lock()


class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, fp: Path, download_name: str):
        if not fp.exists():
            return self._send_json(404, {"ok": False, "error": f"File not found: {fp.name}"})
        data = fp.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.send_header("Content-Disposition", f'attachment; filename="{download_name}"')
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/api/scan-status"):
            return self._send_json(
                200,
                {
                    "ok": True,
                    "localScraperAvailable": SCRAPER_SCRIPT.exists(),
                    "updateDataExists": (UPDATE_DATA_DIR / "update_data.xlsx").exists(),
                    "priceExcelExists": (UPDATE_DATA_DIR / "so_sanh_gia.xlsx").exists(),
                },
            )
        if self.path.startswith("/api/download-template"):
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            kind = (qs.get("type") or ["update_data"])[0]
            if kind == "so_sanh_gia":
                return self._send_file(UPDATE_DATA_DIR / "so_sanh_gia.xlsx", "so_sanh_gia.xlsx")
            return self._send_file(UPDATE_DATA_DIR / "update_data.xlsx", "update_data.xlsx")
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/scan-prices"):
            if not _scan_lock.acquire(blocking=False):
                return self._send_json(409, {"ok": False, "error": "Đang có tiến trình Agent quét giá khác đang chạy, vui lòng đợi giây lát."})
            try:
                proc = subprocess.run(
                    [sys.executable, str(SCRAPER_SCRIPT)],
                    cwd=str(BASE_DIR),
                    capture_output=True,
                    text=True,
                    timeout=90,
                )
                if proc.returncode != 0:
                    err_msg = (proc.stderr or proc.stdout or "Scraper exited with error").strip()[-500:]
                    return self._send_json(500, {"ok": False, "error": err_msg})
                data = json.loads(PRICE_JSON.read_text(encoding="utf-8"))
                return self._send_json(200, {"ok": True, "data": data})
            except Exception as exc:
                return self._send_json(500, {"ok": False, "error": str(exc)})
            finally:
                _scan_lock.release()

        if self.path.startswith("/api/upload-update-data"):
            if not _etl_lock.acquire(blocking=False):
                return self._send_json(409, {"ok": False, "error": "Đang xử lý cập nhật dữ liệu, vui lòng đợi giây lát."})
            try:
                length = int(self.headers.get("Content-Length") or 0)
                if length <= 0:
                    return self._send_json(400, {"ok": False, "error": "File tải lên trống."})
                raw_bytes = self.rfile.read(length)
                UPDATE_DATA_DIR.mkdir(parents=True, exist_ok=True)
                target_xlsx = UPDATE_DATA_DIR / "update_data.xlsx"
                target_xlsx.write_bytes(raw_bytes)
                proc = subprocess.run(
                    [sys.executable, str(BUILD_SCRIPT), "--update-excel", str(target_xlsx)],
                    cwd=str(BASE_DIR),
                    capture_output=True,
                    text=True,
                    timeout=180,
                )
                if proc.returncode != 0:
                    err_msg = (proc.stderr or proc.stdout or "ETL exited with error").strip()[-600:]
                    return self._send_json(500, {"ok": False, "error": err_msg})
                data = json.loads(REPORT_JSON.read_text(encoding="utf-8"))
                return self._send_json(200, {"ok": True, "data": data, "log": (proc.stdout or "").strip()[-400:]})
            except Exception as exc:
                return self._send_json(500, {"ok": False, "error": str(exc)})
            finally:
                _etl_lock.release()

        if self.path.startswith("/api/save-price-compare"):
            try:
                length = int(self.headers.get("Content-Length") or 0)
                raw = self.rfile.read(length).decode("utf-8", errors="replace")
                payload = json.loads(raw)
                PRICE_JSON.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                try:
                    sys.path.insert(0, str(BASE_DIR / "scripts"))
                    from generate_excel_templates import build_price_compare_excel
                    build_price_compare_excel(payload)
                except Exception:
                    pass
                return self._send_json(200, {"ok": True})
            except Exception as exc:
                return self._send_json(500, {"ok": False, "error": str(exc)})

        return self._send_json(404, {"ok": False, "error": "Not found"})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), DashboardHandler)
    print(f"ACCY BI Local Server running at http://localhost:{port} (serving {PUBLIC_DIR})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
