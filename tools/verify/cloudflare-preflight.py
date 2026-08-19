#!/usr/bin/env python3
"""Summarise Cloudflare preflight responses without echoing any secret.

The token value is never read here. The account ID is read only to compare
against what the API returns, and is reported as a boolean match rather than
printed — it is a masked GitHub secret and stays that way.
"""
import json
import os
import sys


def load(path):
    try:
        with open(path) as handle:
            return json.load(handle)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as error:
        print(f"{path}: not valid JSON ({error})")
        return None


def report_databases():
    rows = load("d1.json")
    if rows is None:
        print("d1.json missing — the listing did not complete.")
        return 1
    print(f"databases in account: {len(rows)}")
    for row in rows:
        shown = {k: row.get(k) for k in ("name", "uuid", "version", "created_at") if k in row}
        print("  -", shown)
    return 0


def report_identity():
    verify = load("verify.json")
    if verify is None:
        print("verify.json missing — the token check did not complete.")
        return 1
    print("== token ==")
    print("  success :", verify.get("success"))
    print("  status  :", (verify.get("result") or {}).get("status"))
    if verify.get("errors"):
        print("  errors  :", verify["errors"])
    for message in verify.get("messages", []):
        print("  message :", message.get("message"))

    accounts = load("accounts.json")
    if accounts is None:
        print("accounts.json missing — the account check did not complete.")
        return 1
    print("== accounts ==")
    print("  success :", accounts.get("success"))
    if accounts.get("errors"):
        print("  errors  :", accounts["errors"])
    results = accounts.get("result") or []
    print("  visible to this token:", len(results))
    wanted = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    for account in results:
        matches = account.get("id") == wanted
        print(f"  - name: {account.get('name')!r} | matches configured id: {matches}")
    return 0


if __name__ == "__main__":
    sys.exit(report_databases() if "--databases" in sys.argv else report_identity())
