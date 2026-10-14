#!/usr/bin/env python3
"""
Add (or update) a coupon in the "Coupon" collection.

Examples
  # 20% off, capped at Rs 200, valid until 31 Jan 2027, first 100 uses
  python add_coupon.py WELCOME20 --type percent --value 20 --max-discount 200 \
      --expires 2027-01-31 --max-redemptions 100

  # Rs 100 off, no expiry, unlimited uses
  python add_coupon.py FLAT100 --type flat --value 100

  # 100% off (the card is unlocked without opening Razorpay)
  python add_coupon.py FREEPASS --type percent --value 100 --max-redemptions 1

  # Change an existing coupon (keeps its redeemedCount)
  python add_coupon.py WELCOME20 --type percent --value 25 --update

Connection: reads the Mongo URI and database name from --uri / --db, or from your .env
(MONGODB_URI / MONGO_URI / MONGO_URL and MONGODB_DB / MONGO_DB / DB_NAME).
Use the SAME database your FastAPI app uses.
"""

import argparse
import os
import re
import sys
from datetime import datetime, timezone

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError, PyMongoError

try:  # optional: load .env if python-dotenv is installed
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

URI_VARS = ("MONGODB_URI", "MONGO_URI", "MONGO_URL", "DATABASE_URL")
DB_VARS = ("MONGODB_DB", "MONGO_DB", "DB_NAME", "DATABASE_NAME")
COLLECTION = "Coupon"
CODE_PATTERN = re.compile(r"^[A-Z0-9_-]{3,40}$")


def env_first(names: tuple[str, ...]) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value:
            return value.strip().strip("\"'")
    return None


def parse_expiry(text: str) -> datetime:
    """'2027-01-31' means the END of that day (UTC); a full ISO datetime is used as given."""
    try:
        if len(text) == 10:
            return datetime.strptime(text, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            )
        parsed = datetime.fromisoformat(text)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        raise argparse.ArgumentTypeError("use YYYY-MM-DD or a full ISO datetime, e.g. 2027-01-31T18:30:00+05:30")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Add or update a coupon.", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    p.add_argument("code", help="coupon code, e.g. WELCOME20 (letters, digits, - and _ only)")
    p.add_argument("--type", dest="discount_type", choices=["percent", "flat"], required=True)
    p.add_argument("--value", type=float, required=True, help="percent (1-100) or rupees off")
    p.add_argument("--max-discount", type=float, help="percent coupons only: cap in rupees")
    p.add_argument("--expires", type=parse_expiry, help="YYYY-MM-DD (end of that day, UTC) or ISO datetime")
    p.add_argument("--max-redemptions", type=int, help="total number of uses; omit for unlimited")
    p.add_argument("--inactive", action="store_true", help="create the coupon switched off")
    p.add_argument("--update", action="store_true", help="update an existing coupon instead of creating one")
    p.add_argument("--uri", help="Mongo connection string (default: from .env)")
    p.add_argument("--db", help="database name (default: from .env or the URI)")
    return p


def validate(args: argparse.Namespace) -> str:
    code = args.code.strip().upper()
    if not CODE_PATTERN.match(code):
        sys.exit("Error: code must be 3-40 characters: letters, digits, '-' or '_'.")

    if args.discount_type == "percent" and not (0 < args.value <= 100):
        sys.exit("Error: a percent coupon needs --value between 1 and 100.")
    if args.discount_type == "flat" and args.value <= 0:
        sys.exit("Error: a flat coupon needs --value greater than 0.")

    if args.max_discount is not None:
        if args.discount_type != "percent":
            sys.exit("Error: --max-discount only applies to percent coupons.")
        if args.max_discount <= 0:
            sys.exit("Error: --max-discount must be greater than 0.")

    if args.max_redemptions is not None and args.max_redemptions < 1:
        sys.exit("Error: --max-redemptions must be at least 1.")

    if args.expires and args.expires < datetime.now(timezone.utc):
        sys.exit("Error: the expiry date is already in the past.")

    return code


def main() -> None:
    args = build_parser().parse_args()
    code = validate(args)

    uri = args.uri or env_first(URI_VARS)
    if not uri:
        sys.exit("Error: no Mongo URI found. Pass --uri or set MONGODB_URI in your .env.")

    client = MongoClient(uri, tz_aware=True, serverSelectionTimeoutMS=8000)
    try:
        db_name = args.db or env_first(DB_VARS)
        if db_name:
            db = client[db_name]
        else:
            try:
                db = client.get_default_database()
            except Exception:
                sys.exit("Error: no database name. Pass --db or set MONGODB_DB in your .env.")

        coupons = db[COLLECTION]
        coupons.create_index("code", unique=True)  # safe to repeat

        settings = {
            "discountType": args.discount_type,
            "value": args.value,
            "maxDiscount": args.max_discount,
            "isActive": not args.inactive,
            "expiresAt": args.expires,
            "maxRedemptions": args.max_redemptions,
        }

        if args.update:
            result = coupons.update_one({"code": code}, {"$set": settings})
            if result.matched_count == 0:
                sys.exit(f"Error: coupon {code} doesn't exist. Run again without --update to create it.")
            action = "Updated"
        else:
            try:
                coupons.insert_one({"code": code, **settings, "redeemedCount": 0})
            except DuplicateKeyError:
                sys.exit(f"Error: coupon {code} already exists. Use --update to change it.")
            action = "Created"

        print(f"{action} coupon {code} in {db.name}.{COLLECTION}")
        print(f"  discount        : {args.value:g}{'%' if args.discount_type == 'percent' else ' rupees off'}")
        if args.max_discount:
            print(f"  max discount    : {args.max_discount:g} rupees")
        print(f"  expires         : {args.expires.isoformat() if args.expires else 'never'}")
        print(f"  max redemptions : {args.max_redemptions if args.max_redemptions else 'unlimited'}")
        print(f"  active          : {not args.inactive}")
    except PyMongoError as exc:
        sys.exit(f"Database error: {exc}")
    finally:
        client.close()


if __name__ == "__main__":
    main()