#!/usr/bin/env python3
"""Zero-dependency local HTTP dev server for the Fernvow static ES-module storefront."""

from __future__ import annotations

import functools
import http.server
import mimetypes
import os
import signal
import socketserver
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent


class FernvowRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serves static storefront files with accurate MIME types and clean cache headers."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".svg": "image/svg+xml; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".glb": "model/gltf-binary",
        ".woff2": "font/woff2",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        sys.stdout.write(f"[fernvow] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()


class ReusableThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    mimetypes.init()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "4173"))

    handler = functools.partial(FernvowRequestHandler, directory=str(ROOT_DIR))

    with ReusableThreadingTCPServer((host, port), handler) as httpd:
        def handle_shutdown(signum: int, _frame: object) -> None:
            sys.stdout.write(f"\n[fernvow] Shutting down (signal {signum})...\n")
            sys.stdout.flush()
            httpd.server_close()
            sys.exit(0)

        signal.signal(signal.SIGINT, handle_shutdown)
        signal.signal(signal.SIGTERM, handle_shutdown)

        sys.stdout.write(
            f"[fernvow] Serving {ROOT_DIR} at http://{host}:{port}\n"
            f"[fernvow] Press Ctrl+C to stop.\n"
        )
        sys.stdout.flush()
        httpd.serve_forever()


if __name__ == "__main__":
    main()
