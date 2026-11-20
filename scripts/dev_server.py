#!/usr/bin/env python3
"""Zero-dependency local HTTP server for the Fernvow storefront."""

from __future__ import annotations

import ipaddress
import os
from socketserver import ThreadingMixIn
from urllib.parse import urlsplit
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

from web import create_app


class ThreadedWSGIServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True


class StorefrontRequestHandler(WSGIRequestHandler):
    timeout = 15

    def log_request(self, code="-", size="-"):
        self.log_message("%s %s %s", self.command, urlsplit(self.path).path, code)


def main():
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "4173"))
    if os.environ.get("FERNVOW_CHECKOUT_MODE") == "live":
        raise SystemExit("Run live checkout with a production WSGI server. See docs/payments-setup.md.")
    local_host = host
    try:
        if ipaddress.ip_address(host).is_unspecified:
            local_host = "127.0.0.1"
    except ValueError:
        pass
    origin = f"http://{local_host}:{port}"
    with make_server(host, port, create_app(origin), ThreadedWSGIServer, StorefrontRequestHandler) as server:
        print(f"[fernvow] Serving {origin}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
