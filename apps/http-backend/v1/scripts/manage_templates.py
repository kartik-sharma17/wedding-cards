"""
Sync the TEMPLATES_JSON below with the MongoDB `templates` collection.

  - in JSON, not in DB      -> added
  - in both, but different  -> updated
  - in DB, not in JSON      -> deleted

Templates are matched by `templateName`.

Run:  python sync_templates.py
Env:  MONGO_URI, MONGO_DB_NAME, (optional) MONGO_COLLECTION
"""

import asyncio
import json
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from v1.models import Template

load_dotenv()

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
    coll = client[os.environ["DATABASE_NAME"]][os.getenv("MONGO_COLLECTION", "templates")]
    await coll.create_index("templateName", unique=True)

    # JSON -> validated Template models, keyed by name
    wanted = {}
    for item in json.loads(TEMPLATES_JSON):
        t = Template(**item)
        wanted[t.templateName] = {
            "full": t.model_dump(mode="json"),                    # used for insert
            "fields": t.model_dump(mode="json", exclude_unset=True),  # only what's in the JSON
        }

    # What's currently in DB, keyed by name
    existing = {doc["templateName"]: doc async for doc in coll.find({})}

    # Add / update
    for name, data in wanted.items():
        if name not in existing:
            await coll.insert_one(data["full"])
            print(f"[added]   {name}")
        else:
            db_doc = existing[name]
            changed = {k: v for k, v in data["fields"].items() if db_doc.get(k) != v}
            if changed:
                await coll.update_one({"templateName": name}, {"$set": changed})
                print(f"[updated] {name}: {', '.join(changed)}")
            else:
                print(f"[same]    {name}")

    # Delete anything in DB that's no longer in the JSON
    for name in existing.keys() - wanted.keys():
        await coll.delete_one({"templateName": name})
        print(f"[deleted] {name}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())