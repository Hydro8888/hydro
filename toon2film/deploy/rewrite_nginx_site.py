#!/usr/bin/env python3
"""Safely rewrite Toon2Film Nginx locations in one active site file."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


SERVER_RE = re.compile(r"(?m)^[\ufeff \t]*server[ \t]*\{")
LOCATION_RE = re.compile(
    r"(?m)^[ \t]*location[ \t]+(?:(?:=|\^~|~\*|~)[ \t]+)?(?P<path>[^ \t{]+)"
)


def find_braced_blocks(text: str, pattern: re.Pattern[str]) -> list[tuple[int, int]]:
    blocks: list[tuple[int, int]] = []
    for match in pattern.finditer(text):
        open_index = text.find("{", match.start())
        if open_index == -1:
            continue
        depth = 0
        for index in range(open_index, len(text)):
            char = text[index]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    blocks.append((match.start(), index + 1))
                    break
    return blocks


def is_http_server(server_text: str) -> bool:
    return bool(re.search(r"(?m)^[ \t]*listen[ \t]+[^;]*(:)?80(?:[ \t;]|$)", server_text))


def should_remove_location(path: str, base_path: str) -> bool:
    clean_path = path.strip("\"'")
    return (
        clean_path == base_path
        or clean_path == f"{base_path}/"
        or clean_path.startswith(f"{base_path}/")
        or base_path in clean_path and clean_path.startswith("^")
    )


def remove_legacy_locations(server_text: str, base_path: str) -> tuple[str, int]:
    ranges: list[tuple[int, int]] = []
    for match in LOCATION_RE.finditer(server_text):
        if not should_remove_location(match.group("path"), base_path):
            continue
        open_index = server_text.find("{", match.end())
        if open_index == -1:
            continue
        depth = 0
        close_index = None
        for index in range(open_index, len(server_text)):
            char = server_text[index]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    close_index = index + 1
                    break
        if close_index is None:
            raise SystemExit(f"Unclosed location block for {match.group('path')}")
        start = server_text.rfind("\n", 0, match.start()) + 1
        end = close_index
        if end < len(server_text) and server_text[end : end + 1] == "\n":
            end += 1
        ranges.append((start, end))

    if not ranges:
        return server_text, 0

    cleaned: list[str] = []
    cursor = 0
    for start, end in sorted(ranges):
        cleaned.append(server_text[cursor:start])
        cursor = end
    cleaned.append(server_text[cursor:])
    return "".join(cleaned), len(ranges)


def rewrite_site(site: Path, block: str, service_name: str, base_path: str) -> None:
    text = site.read_text(encoding="utf-8")
    marker_pattern = re.compile(
        rf"\n?[ \t]*# BEGIN {re.escape(service_name)} managed block.*?"
        rf"[ \t]*# END {re.escape(service_name)} managed block\n?",
        re.S,
    )
    text = marker_pattern.sub("\n", text)

    server_blocks = find_braced_blocks(text, SERVER_RE)
    if not server_blocks:
        raise SystemExit(f"No server block found in {site}")

    targets = [(start, end) for start, end in server_blocks if is_http_server(text[start:end])]
    if not targets and len(server_blocks) == 1:
        targets = server_blocks
    if not targets:
        raise SystemExit(f"No HTTP :80 server block found in {site}")

    total_removed = 0
    for start, end in reversed(targets):
        server_text = text[start:end]
        server_text, removed = remove_legacy_locations(server_text, base_path)
        total_removed += removed
        close_index = server_text.rfind("}")
        if close_index == -1:
            raise SystemExit(f"No closing brace found in server block for {site}")
        server_text = (
            server_text[:close_index].rstrip()
            + "\n\n"
            + block.rstrip()
            + "\n"
            + server_text[close_index:]
        )
        text = text[:start] + server_text + text[end:]

    site.write_text(text, encoding="utf-8")
    print(
        f"Updated {site}: targets={len(targets)}, removed_legacy_locations={total_removed}",
        flush=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, type=Path)
    parser.add_argument("--block-file", required=True, type=Path)
    parser.add_argument("--service-name", required=True)
    parser.add_argument("--base-path", required=True)
    args = parser.parse_args()

    base_path = args.base_path.rstrip("/") or "/"
    rewrite_site(
        site=args.site,
        block=args.block_file.read_text(encoding="utf-8"),
        service_name=args.service_name,
        base_path=base_path,
    )


if __name__ == "__main__":
    main()
