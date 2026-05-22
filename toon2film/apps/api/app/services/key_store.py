from __future__ import annotations

import base64
import hashlib

from app.core.config import settings


class KeyStore:
    def protect(self, raw_key: str) -> str:
        if not settings.encryption_key:
            raise RuntimeError("ENCRYPTION_KEY is required before storing provider keys")
        digest = hashlib.sha256(settings.encryption_key.encode("utf-8")).digest()
        raw = raw_key.encode("utf-8")
        masked = bytes(byte ^ digest[index % len(digest)] for index, byte in enumerate(raw))
        return base64.urlsafe_b64encode(masked).decode("ascii")

    def reveal(self, protected_key: str) -> str:
        if not settings.encryption_key:
            raise RuntimeError("ENCRYPTION_KEY is required before reading provider keys")
        digest = hashlib.sha256(settings.encryption_key.encode("utf-8")).digest()
        raw = base64.urlsafe_b64decode(protected_key.encode("ascii"))
        unmasked = bytes(byte ^ digest[index % len(digest)] for index, byte in enumerate(raw))
        return unmasked.decode("utf-8")
