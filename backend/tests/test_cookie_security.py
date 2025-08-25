import pytest
from fastapi import Response

from app.middleware.auth_cookies import set_auth_cookies
from app.core.config import settings


def test_set_auth_cookies_flags():
    resp = Response()
    token = "test.jwt.token"

    # ensure defaults from settings are applied
    assert getattr(settings, "COOKIE_SECURE", True) in (True, False)
    assert getattr(settings, "COOKIE_SAMESITE", "lax") in ("lax", "strict", "none")

    set_auth_cookies(resp, token)

    # Starlette stores cookies in headers
    hdrs = dict(resp.headers)
    set_cookie_values = [v for (k, v) in resp.raw_headers if k.lower() == b"set-cookie"]
    cookie_blob = b"\n".join(set_cookie_values).decode()

    # Access token cookie flags
    assert "access_token=" in cookie_blob
    # httpOnly flag present
    assert "; HttpOnly" in cookie_blob or "; httponly" in cookie_blob.lower()
    # secure flag according to settings
    if settings.COOKIE_SECURE:
        assert "; Secure" in cookie_blob or "; secure" in cookie_blob.lower()
    # samesite value according to settings
    assert f"SameSite={settings.COOKIE_SAMESITE}".lower() in cookie_blob.lower()
