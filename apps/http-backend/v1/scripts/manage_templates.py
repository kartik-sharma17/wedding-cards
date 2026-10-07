"""
Sync the TEMPLATES_JSON below with the MongoDB templates collection.

  - in JSON, not in DB      -> added
  - in both, but different  -> updated
  - in DB, not in JSON      -> deleted

Templates are matched by `slug` (unique). `templateName` can repeat.

Run:  python -m v1.scripts.manage_templates
Env:  MONGO_URL, DATABASE_NAME, (optional) MONGO_COLLECTION
"""

import asyncio
import json
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure
from v1.models import Template

load_dotenv()

TEMPLATES_JSON = """
[
  {
    "templateName": "Royal Wedding",
    "slug": "royal-wedding",
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
    "slug": "golden-anniversary",
    "category": "anniversary",
    "templateType": "video",
    "current_version": 1,
    "price": 799,
    "currency": "INR",
    "is_free": false,
    "thumbnail_url": "https://example.com/thumbs/golden-anniversary.jpg",
    "preview_images": [
      "https://example.com/previews/golden-anniversary-1.jpg"
    ],
    "max_photos": 10,
    "requires_video": true,
    "is_active": true
  },
  {
    "templateName": "Baby Bloom",
    "slug": "baby-bloom",
    "category": "baby_shower",
    "templateType": "card",
    "current_version": 1,
    "price": 0,
    "currency": "INR",
    "is_free": true,
    "thumbnail_url": "https://example.com/thumbs/baby-bloom.jpg",
    "preview_images": [
      "https://example.com/previews/baby-bloom-1.jpg",
      "https://example.com/previews/baby-bloom-2.jpg"
    ],
    "max_photos": 2,
    "requires_video": false,
    "is_active": true
  }
]
"""


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"], serverSelectionTimeoutMS=5000)
    coll = client[os.environ["DATABASE_NAME"]][os.getenv("MONGO_COLLECTION", "Template")]

    # Remove the old unique index on templateName (if it still exists)
    try:
        await coll.drop_index("templateName_1")
        print("[index]   dropped old unique index on templateName")
    except OperationFailure:
        pass

    # JSON -> validated Template models, keyed by slug
    wanted = {}
    for item in json.loads(TEMPLATES_JSON):
        t = Template(**item)
        if t.slug in wanted:
            raise SystemExit(f"Duplicate slug in JSON: {t.slug}")
        wanted[t.slug] = {
            "full": t.model_dump(mode="json", exclude={"id"}),           # used for insert
            "fields": t.model_dump(mode="json", exclude_unset=True),     # only what's in the JSON
        }

    # What's currently in DB, keyed by slug (old docs without a slug use None)
    existing = {}
    stale_ids = []
    async for doc in coll.find({}):
        slug = doc.get("slug")
        if slug is None or slug in existing:
            stale_ids.append(doc["_id"])   # no slug / duplicate slug -> remove
        else:
            existing[slug] = doc

    # Delete docs that are no longer in the JSON (before the unique index is built)
    for slug, doc in list(existing.items()):
        if slug not in wanted:
            stale_ids.append(doc["_id"])
            print(f"[deleted] {slug}")
            del existing[slug]
    if stale_ids:
        res = await coll.delete_many({"_id": {"$in": stale_ids}})
        print(f"[cleanup] removed {res.deleted_count} doc(s) not in JSON (incl. any without a slug)")

    await coll.create_index("slug", unique=True)

    # Add / update
    for slug, data in wanted.items():
        if slug not in existing:
            await coll.insert_one(data["full"])
            print(f"[added]   {slug}")
        else:
            db_doc = existing[slug]
            changed = {k: v for k, v in data["fields"].items() if db_doc.get(k) != v}
            if changed:
                await coll.update_one({"slug": slug}, {"$set": changed})
                print(f"[updated] {slug}: {', '.join(changed)}")
            else:
                print(f"[same]    {slug}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())