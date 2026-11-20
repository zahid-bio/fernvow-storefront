"""WSGI storefront and checkout API. Payment credentials stay server-side."""

from __future__ import annotations

import json
import logging
import mimetypes
import os
import re
from http import HTTPStatus
from pathlib import Path
from urllib.parse import urlsplit
from wsgiref.util import FileWrapper

if __package__:
    from .checkout import Checkout, CheckoutError, public_shipping_settings
else:
    from checkout import Checkout, CheckoutError, public_shipping_settings

ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_PAGE = re.compile(r"(?:product|policies)/[a-z0-9-]+|routine|philosophy")
PUBLIC_VERIFICATION_FILE = re.compile(r"google[0-9a-f]+\.html")
RESPONSE_HEADERS = [
    ("Cache-Control", "no-store"),
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "no-referrer"),
]
CONTENT_TYPES = {
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".glb": "model/gltf-binary",
}


def json_response(start_response, status, payload):
    encoded = json.dumps(payload).encode()
    start_response(f"{status} {HTTPStatus(status).phrase}", [
        *RESPONSE_HEADERS,
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(encoded))),
    ])
    return [encoded]


def serve_file(environ, start_response):
    request_path = environ["PATH_INFO"].strip("/")
    if not request_path or PUBLIC_PAGE.fullmatch(request_path):
        location = ROOT_DIR / "dist" / request_path / "index.html"
        if not request_path and not location.is_file():
            location = ROOT_DIR / "index.html"
        public = True
    elif request_path in {"robots.txt", "sitemap.xml"} or PUBLIC_VERIFICATION_FILE.fullmatch(request_path):
        location = ROOT_DIR / "dist" / request_path
        public = True
    else:
        location = (ROOT_DIR / request_path).resolve()
        relative = location.relative_to(ROOT_DIR) if location.is_relative_to(ROOT_DIR) else None
        public = relative is not None and bool(relative.parts) and (
            relative.parts[0] in {"src", "assets"} or relative.as_posix() == "config/storefront.config.js"
        )
    if not public or not location.is_file():
        return json_response(start_response, 404, {"message": "Not found."})
    content_type = CONTENT_TYPES.get(location.suffix) or mimetypes.guess_type(location)[0]
    start_response("200 OK", [
        *RESPONSE_HEADERS,
        ("Content-Type", content_type or "application/octet-stream"),
        ("Content-Length", str(location.stat().st_size)),
    ])
    if environ["REQUEST_METHOD"] == "HEAD":
        return []
    return environ.get("wsgi.file_wrapper", FileWrapper)(location.open("rb"))


def checkout_api(checkout, environ, start_response):
    path = environ["PATH_INFO"]
    method = environ["REQUEST_METHOD"]
    if path == "/api/checkout/methods" and method == "GET":
        settings = {"enabled": checkout.enabled}
        if checkout.enabled:
            settings["shipping"] = public_shipping_settings()
        return json_response(start_response, 200, settings)

    try:
        if path not in {"/api/checkout", "/api/checkout/status", "/api/webhooks/stripe"}:
            raise CheckoutError(404, "Endpoint not found.")
        if method != "POST":
            raise CheckoutError(405, "Use POST for this endpoint.")
        if environ.get("CONTENT_TYPE", "").partition(";")[0].strip() != "application/json":
            raise CheckoutError(415, "Expected JSON.")
        if path != "/api/webhooks/stripe" and environ.get("HTTP_ORIGIN") != checkout.origin:
            raise CheckoutError(403, "Checkout must start from the storefront.")
        size = int(environ.get("CONTENT_LENGTH") or "0")
        if not 1 <= size <= 128_000:
            raise CheckoutError(413, "Invalid request size.")
        payload = environ["wsgi.input"].read(size)
        if path == "/api/webhooks/stripe":
            result = checkout.stripe_webhook(payload, environ.get("HTTP_STRIPE_SIGNATURE", ""))
        else:
            body = json.loads(payload)
            if not isinstance(body, dict):
                raise CheckoutError(400, "Invalid checkout request.")
            result = checkout.create(body) if path == "/api/checkout" else checkout.status(
                body.get("reference"), body.get("sessionId"),
            )
        return json_response(start_response, 200, result)
    except CheckoutError as error:
        return json_response(start_response, error.status, {"message": str(error)})
    except (ValueError, TimeoutError):
        return json_response(start_response, 400, {"message": "Invalid checkout request."})
    except Exception as error:
        logging.error("Checkout request failed (%s)", type(error).__name__)
        return json_response(start_response, 502, {"message": "Checkout is temporarily unavailable. Please try again."})


def create_app(local_origin="http://127.0.0.1:4173"):
    origin = (os.environ.get("FERNVOW_PUBLIC_ORIGIN") or local_origin).rstrip("/")
    url = urlsplit(origin)
    if url.scheme not in {"http", "https"} or not url.hostname or url.path or url.query or url.fragment or url.username:
        raise ValueError("FERNVOW_PUBLIC_ORIGIN must contain only the protocol and host.")
    checkout = Checkout.from_environment(origin)

    def app(environ, start_response):
        if environ["PATH_INFO"].startswith("/api/"):
            return checkout_api(checkout, environ, start_response)
        if environ["REQUEST_METHOD"] in {"GET", "HEAD"}:
            return serve_file(environ, start_response)
        return json_response(start_response, 405, {"message": "Method not allowed."})

    return app
