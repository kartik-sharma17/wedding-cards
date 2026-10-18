# v1/utility/pdfRenderer.py
"""Turns a URL into PDF bytes using Chrome.

  GOTENBERG_URL set  -> uses a Gotenberg container (Chrome behind an HTTP API)
  otherwise          -> uses Chrome through Playwright on this machine
                        (PDF_CHROME_CHANNEL=chrome uses the Google Chrome you already have installed)

The page size comes from the template's own CSS (@page), so nothing here knows the card size.
The page tells us when it's ready by setting data-ready="true" on .pp-root.
"""

import logging
import os

import httpx
from fastapi import HTTPException

from config import settings

logger = logging.getLogger(__name__)

# Read from settings like your other values; falls back to the process environment, and to "" if unset.
GOTENBERG_URL = (getattr(settings, "GOTENBERG_URL", None) or os.getenv("GOTENBERG_URL") or "").rstrip("/")
# Use an installed browser instead of Playwright's own download (needed on macOS 13, where
# `playwright install chromium` is not supported). e.g. PDF_CHROME_CHANNEL=chrome or msedge.
CHROME_CHANNEL = settings.PDF_CHROME_CHANNEL or None
READY_SELECTOR = '.pp-root[data-ready="true"]'
FAILED = HTTPException(status_code=502, detail="We couldn't create the PDF. Please try again.")


async def render_pdf(url: str) -> bytes:
    try:
        return await (_gotenberg(url) if GOTENBERG_URL else _playwright(url))
    except HTTPException:
        raise
    except Exception as exc:  # any browser/network problem becomes one clean error for the user
        logger.error("PDF render failed for %s: %r", url.split("?")[0], exc)
        raise FAILED


async def _playwright(url: str) -> bytes:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("Playwright isn't installed: pip install playwright (and `playwright install chromium`, or set PDF_CHROME_CHANNEL=chrome)")
        raise FAILED

    async with async_playwright() as pw:
        # In Docker as root, launch with args=["--no-sandbox"].
        browser = await pw.chromium.launch(channel=CHROME_CHANNEL)
        try:
            page = await browser.new_page()

            # Collect what the page itself reports, so a timeout comes with a reason.
            problems: list[str] = []
            page.on("pageerror", lambda e: problems.append(f"pageerror: {e}"))
            page.on("console", lambda m: problems.append(f"console.error: {m.text}") if m.type == "error" else None)

            await page.emulate_media(media="print")
            response = await page.goto(url, wait_until="networkidle", timeout=45_000)
            if response is None or response.status >= 400:
                raise RuntimeError(f"print page returned {response.status if response else 'nothing'}")

            try:
                await page.wait_for_selector(READY_SELECTOR, state="attached", timeout=25_000)
            except Exception:
                raise RuntimeError(f"the print page never became ready. Browser errors: {problems[-5:] or 'none'}")

            return await page.pdf(prefer_css_page_size=True, print_background=True)
        finally:
            await browser.close()


async def _gotenberg(url: str) -> bytes:
    fields = {
        "url": url,
        "preferCssPageSize": "true",
        "printBackground": "true",
        "emulatedMediaType": "print",
        "waitForExpression": f"document.querySelector('{READY_SELECTOR}') !== null",
    }
    # (None, value) makes httpx send multipart/form-data, which Gotenberg requires.
    async with httpx.AsyncClient(timeout=90) as client:
        res = await client.post(f"{GOTENBERG_URL}/forms/chromium/convert/url", files={k: (None, v) for k, v in fields.items()})
    if res.status_code != 200:
        raise RuntimeError(f"Gotenberg returned {res.status_code}: {res.text[:200]}")
    return res.content