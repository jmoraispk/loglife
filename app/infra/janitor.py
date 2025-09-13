"""Janitor tasks for cleanup (e.g., expired exports)."""

from __future__ import annotations

import os
import time


def cleanup_exports(older_than_seconds: int = 86400) -> int:
    """Delete files in ./exports older than TTL. Returns count deleted."""
    base = os.path.join(os.getcwd(), "exports")
    if not os.path.isdir(base):
        return 0
    now = time.time()
    deleted = 0
    for name in os.listdir(base):
        path = os.path.join(base, name)
        try:
            st = os.stat(path)
        except FileNotFoundError:
            continue
        if now - st.st_mtime > older_than_seconds:
            try:
                os.remove(path)
                deleted += 1
            except OSError:
                pass
    return deleted
