"""
Add / update / delete Template documents in MongoDB (using Motor, async)
from a JSON list embedded in this script.

Setup:
    pip install motor pydantic python-dotenv

Credentials (env vars or a .env file next to this script):
    MONGO_URI=mongodb://user:pass@host:27017/?authSource=admin
    MONGO_DB_NAME=mydb
    MONGO_COLLECTION=templates      # optional, defaults to "templates"

Usage:
    python manage_templates.py add              # insert templates that don't exist yet
    python manage_templates.py update           # update existing templates (matched by templateName)
    python manage_templates.py upsert           # update if exists, otherwise insert
    python manage_templates.py delete           # delete templates listed in the JSON
    python manage_templates.py delete --yes     # skip confirmation prompt
    python manage_templates.py <cmd> --dry-run  # show what would happen, change nothing
"""

import argparse
import asyncio
import json
import os
import sys
from enum import Enum

from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ValidationError
from pymongo.errors import DuplicateKeyError

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass  # fine if env vars are already set


# ---------------------------------------------------------------------------
# Edit this JSON. `templateName` is the unique key used to match documents.
# ---------------------------------------------------------------------------
TEMPLATES_JSON = """
[
  {
    "templateName": "Royal Wedding",
    "category": "wedding",
    "templateType": "card",
    "current_version": 1,
    "price": 499,
    "currency": "INR",
    "is_free": false,
    "thumbnail_url": "https://example.com/thumbs/royal-wedding.jpg",
    "preview_images": [
      "https://example.com/previews/royal-wedding-1.jpg",
      "https://example.com/previews/royal-wedding-2.jpg"
    ],
    "max_photos": 4,
    "requires_video": false,
    "is_active": true
  },
  {
    "templateName": "Golden Anniversary",
    "category": "anniversary",
    "templateType": "video",
    "current_version": 1,
    "price": 0,
    "currency": "INR",
    "is_free": true,
    "thumbnail_url": null,
    "preview_images": [],
    "max_photos": 10,
    "requires_video": true,
    "is_active": true
  }
]
"""


# ---------------------------------------------------------------------------
# Schema (mirrors your Template model, without the BaseClass/IdentifiedModel
# imports so this script runs standalone). Used only for validation.
# ---------------------------------------------------------------------------
class TemplateCategory(str, Enum):
    wedding = "wedding"
    reception = "reception"
    anniversary = "anniversary"
    engagement = "engagement"
    birthday = "birthday"
    baby_shower = "baby_shower"


class TemplateType(str, Enum):
    card = "card"
    video = "video"


class TemplateData(BaseModel):
    templateName: str
    category: TemplateCategory = TemplateCategory.wedding
    templateType: TemplateType = TemplateType.card
    current_version: int = 1
    price: float = 0
    currency: str = "INR"
    is_free: bool = False
    thumbnail_url: str | None = None
    preview_images: list[str] = Field(default_factory=list)
    max_photos: int = 0
    requires_video: bool = False
    is_active: bool = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def get_client_and_collection():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGO_DB_NAME")
    coll_name = os.getenv("MONGO_COLLECTION", "templates")

    if not uri or not db_name:
        sys.exit("Missing MONGO_URI or MONGO_DB_NAME in environment / .env file.")

    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    await client.admin.command("ping")  # fail fast if creds/host are wrong
    return client, client[db_name][coll_name]


def load_templates() -> list[dict]:
    """Parse and validate the embedded JSON. Returns plain dicts (enums as strings)."""
    try:
        raw = json.loads(TEMPLATES_JSON)
    except json.JSONDecodeError as e:
        sys.exit(f"Invalid JSON in TEMPLATES_JSON: {e}")

    if not isinstance(raw, list):
        sys.exit("TEMPLATES_JSON must be a JSON array of objects.")

    templates, seen = [], set()
    for i, item in enumerate(raw):
        try:
            model = TemplateData(**item)
        except ValidationError as e:
            sys.exit(f"Validation error in item #{i} ({item.get('templateName')}):\n{e}")

        if model.templateName in seen:
            sys.exit(f"Duplicate templateName in JSON: {model.templateName!r}")
        seen.add(model.templateName)

        templates.append(model.model_dump(mode="json"))
    return templates


async def ensure_unique_index(coll):
    # Unique constraint on templateName (no-op if it already exists)
    await coll.create_index("templateName", unique=True)


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------
async def add(coll, templates, dry_run):
    for t in templates:
        name = t["templateName"]
        if await coll.find_one({"templateName": name}, {"_id": 1}):
            print(f"[skip]    {name!r} already exists")
            continue
        if dry_run:
            print(f"[dry-run] would insert {name!r}")
            continue
        try:
            res = await coll.insert_one(t)
            print(f"[added]   {name!r} -> _id={res.inserted_id}")
        except DuplicateKeyError:
            print(f"[skip]    {name!r} already exists (race)")


async def update(coll, templates, dry_run, upsert=False):
    for t in templates:
        name = t["templateName"]
        existing = await coll.find_one({"templateName": name}, {"_id": 1})

        if not existing and not upsert:
            print(f"[missing] {name!r} not found, nothing to update")
            continue
        if dry_run:
            action = "update" if existing else "insert"
            print(f"[dry-run] would {action} {name!r}")
            continue

        res = await coll.update_one({"templateName": name}, {"$set": t}, upsert=upsert)
        if res.upserted_id:
            print(f"[added]   {name!r} -> _id={res.upserted_id}")
        elif res.modified_count:
            print(f"[updated] {name!r}")
        else:
            print(f"[same]    {name!r} already up to date")


async def delete(coll, templates, dry_run, assume_yes):
    names = [t["templateName"] for t in templates]
    print("Templates to delete:")
    for n in names:
        print(f"  - {n}")

    if dry_run:
        found = await coll.count_documents({"templateName": {"$in": names}})
        print(f"[dry-run] would delete {found} document(s)")
        return

    if not assume_yes:
        # input() is blocking; run it in a thread so we don't block the event loop
        answer = await asyncio.to_thread(input, "Type 'yes' to confirm deletion: ")
        if answer.strip().lower() != "yes":
            print("Aborted.")
            return

    for n in names:
        res = await coll.delete_one({"templateName": n})
        print(f"[deleted] {n!r}" if res.deleted_count else f"[missing] {n!r} not found")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
async def main():
    parser = argparse.ArgumentParser(description="Manage Template documents in MongoDB (Motor).")
    parser.add_argument("command", choices=["add", "update", "upsert", "delete"])
    parser.add_argument("--dry-run", action="store_true", help="Show actions without changing the DB")
    parser.add_argument("--yes", action="store_true", help="Skip delete confirmation")
    args = parser.parse_args()

    templates = load_templates()
    client, coll = await get_client_and_collection()

    try:
        await ensure_unique_index(coll)

        if args.command == "add":
            await add(coll, templates, args.dry_run)
        elif args.command == "update":
            await update(coll, templates, args.dry_run)
        elif args.command == "upsert":
            await update(coll, templates, args.dry_run, upsert=True)
        elif args.command == "delete":
            await delete(coll, templates, args.dry_run, args.yes)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())

