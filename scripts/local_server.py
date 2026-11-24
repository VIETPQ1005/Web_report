#!/usr/bin/env python3
"""
Local Static + Price-Scan HTTP Server for PHONG VŨ // ACCY BI Command Dashboard.
Serves `public/` at http://localhost:8080 and exposes:
  - GET  /api/scan-status : Checks whether live Python competitor price scanning is available
  - POST /api/scan-prices : Runs `scripts/scrape_tgdd_ocgn.py` and returns fresh JSON
"""

import functools
import http.server
import json
import subprocess
import sys
import threading
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
SCRAPER_SCRIPT = BASE_DIR / "scripts" / "scrape_tgdd_ocgn.py"
PRICE_JSON = PUBLIC_DIR / "data" / "price_compare_ocgn.json"

_scan_lock = threading.Lock()


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

    def do_GET(self):
        if self.path.startswith("/api/scan-status"):
            return self._send_json(200, {"ok": True, "localScraperAvailable": SCRAPER_SCRIPT.exists()})
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/scan-prices"):
            if not _scan_lock.acquire(blocking=False):
                return self._send_json(409, {"ok": False, "error": "Đang có một tiến trình quét giá khác đang chạy, vui lòng đợi giây lát."})
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
