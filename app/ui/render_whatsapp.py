from typing import Any
import yaml
import os


_CACHE = {}


def _load_strings() -> dict:
    global _CACHE
    if _CACHE:
        return _CACHE
    strings_path = os.path.join(os.path.dirname(__file__), "strings", "whatsapp.en.yaml")
    with open(strings_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    _CACHE = data
    return _CACHE


def render(key: str, style: str, **data: Any) -> str:
    data = dict(data or {})
    style_key = style or "bullet"
    strings = _load_strings()
    style_map = strings.get(style_key) or strings.get("bullet", {})
    tmpl = style_map.get(key)
    if not tmpl:
        tmpl = strings.get("bullet", {}).get(key, "[missing template]")
    try:
        text = tmpl.format(**data)
    except Exception:
        text = tmpl
    if len(text) > 4096:
        text = text[:4080] + "…"  # enforce limit
    return text

