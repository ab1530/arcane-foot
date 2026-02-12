#!/usr/bin/env python3
"""
Sync objects from old Supabase Storage bucket to new Supabase Storage bucket.

Defaults to dry-run. Use --apply to perform uploads.
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from typing import Dict, List, Tuple


def request_json(method: str, url: str, headers: Dict[str, str], body: bytes | None = None):
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
        if not data:
            return None
        return json.loads(data.decode("utf-8"))


def request_bytes(method: str, url: str, headers: Dict[str, str], body: bytes | None = None) -> bytes:
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def list_recursive(base_url: str, service_key: str, bucket: str, prefix: str = "") -> List[str]:
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": "application/json",
    }
    files: List[str] = []
    stack: List[str] = [prefix]

    while stack:
        current_prefix = stack.pop()
        offset = 0
        page_size = 100

        while True:
            payload = {
                "prefix": current_prefix,
                "limit": page_size,
                "offset": offset,
                "sortBy": {"column": "name", "order": "asc"},
            }
            url = f"{base_url}/storage/v1/object/list/{bucket}"
            items = request_json("POST", url, headers, json.dumps(payload).encode("utf-8")) or []

            if not items:
                break

            for item in items:
                name = item.get("name")
                if not name:
                    continue

                # Folder marker in list API usually has id = None
                if item.get("id") is None:
                    stack.append(f"{current_prefix}{name}/")
                else:
                    files.append(f"{current_prefix}{name}")

            if len(items) < page_size:
                break
            offset += page_size

    return sorted(set(files))


def download_object(base_url: str, service_key: str, bucket: str, path: str) -> bytes:
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }
    encoded_path = urllib.parse.quote(path)
    url = f"{base_url}/storage/v1/object/{bucket}/{encoded_path}"
    return request_bytes("GET", url, headers)


def upload_object(base_url: str, service_key: str, bucket: str, path: str, data: bytes):
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "x-upsert": "true",
        "Content-Type": "application/octet-stream",
    }
    encoded_path = urllib.parse.quote(path)
    url = f"{base_url}/storage/v1/object/{bucket}/{encoded_path}"
    request_bytes("POST", url, headers, data)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--old-url", required=True)
    parser.add_argument("--old-key", required=True)
    parser.add_argument("--new-url", required=True)
    parser.add_argument("--new-key", required=True)
    parser.add_argument("--bucket", default="arcane-media")
    parser.add_argument("--prefix", default="")
    parser.add_argument("--apply", action="store_true", help="Actually upload files")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of files to process (0 = no limit)")
    args = parser.parse_args()

    old_base = args.old_url.rstrip("/")
    new_base = args.new_url.rstrip("/")

    print(f"Listing source objects in bucket '{args.bucket}' prefix '{args.prefix}'...")
    files = list_recursive(old_base, args.old_key, args.bucket, args.prefix)

    if args.limit > 0:
        files = files[: args.limit]

    print(f"Found {len(files)} files")

    if not args.apply:
        print("Dry-run mode. Use --apply to execute copy.")
        for path in files[:30]:
            print(f"  - {path}")
        if len(files) > 30:
            print(f"  ... and {len(files)-30} more")
        return 0

    copied = 0
    failed: List[Tuple[str, str]] = []
    for idx, path in enumerate(files, start=1):
        try:
            data = download_object(old_base, args.old_key, args.bucket, path)
            upload_object(new_base, args.new_key, args.bucket, path, data)
            copied += 1
            if idx % 25 == 0:
                print(f"Copied {idx}/{len(files)}")
        except Exception as exc:
            failed.append((path, str(exc)))
            print(f"ERROR copying {path}: {exc}")

    print(f"Done. copied={copied} failed={len(failed)}")
    if failed:
        print("Failed objects:")
        for path, err in failed[:50]:
            print(f"  - {path}: {err}")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
