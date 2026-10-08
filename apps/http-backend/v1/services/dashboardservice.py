from datetime import datetime, timedelta, timezone

from v1.db.connectDB import getDB
from v1.utility import response

RECENT_CARDS_LIMIT = 6


def _toOid(field: str) -> dict:
    """Card stores templateId / cardDetailsId as strings; convert for $lookup."""
    return {
        "$convert": {"input": field, "to": "objectId", "onError": None, "onNull": None}
    }


def _iso(value) -> str | None:
    if not isinstance(value, datetime):
        return None
    if value.tzinfo is None:  # Mongo returns naive UTC datetimes
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _cardTitle(details: dict | None) -> str:
    if not details:
        return "Untitled card"
    if details.get("brideName"):
        return f"{details['brideName']} & {details.get('groomName', '')}".strip(" &")
    return details.get("celebrantName") or "Untitled card"


def _serializeCard(c: dict) -> dict:
    details = c.get("details") or {}
    return {
        "id": str(c["_id"]),
        "title": _cardTitle(details),
        "category": c.get("category") or details.get("category"),
        "status": c.get("status", "draft"),
        "isPaid": bool(c.get("isPaid")),
        "viewCount": c.get("viewCount", 0),
        "rsvpCount": c.get("rsvpCount", 0),
        "publicSlug": c.get("publicSlug"),
        "templateName": c.get("templateName"),
        "templateSlug": c.get("templateSlug"),
        "thumbnailUrl": c.get("thumbnailUrl"),
        "eventDate": _iso(details.get("eventDate")),
        "createdAt": _iso(c.get("createdAt")),
    }


def _demoPayments(cards: list[dict]) -> dict:
    """
    TEMPORARY: payments aren't implemented yet, so this returns sample data tied
    to the user's most recent cards. The response carries `isDemo: True` so the
    frontend can label it.

    To go live, replace the call in GetDashboard with real queries on the
    "Payment" collection (fields from models/payment.py):

        match = {"userId": str(user["_id"])}
        totals = await getDB()["Payment"].aggregate([
            {"$match": {**match, "status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        ]).to_list(1)
        recent = await getDB()["Payment"].find(match).sort("_id", -1).limit(5).to_list(5)
    """
    samples = [(499.0, "paid"), (799.0, "paid"), (299.0, "failed")]
    now = datetime.now(timezone.utc)

    recent = [
        {
            "id": f"demo_pay_{i + 1}",
            "cardId": card["id"],
            "cardTitle": card["title"],
            "amount": amount,
            "currency": "INR",
            "status": status,
            "provider": "razorpay",
            "paidAt": _iso(now - timedelta(days=3 * (i + 1))),
        }
        for i, (card, (amount, status)) in enumerate(zip(cards, samples))
    ]
    paid = [p for p in recent if p["status"] == "paid"]

    return {
        "isDemo": True,
        "currency": "INR",
        "totalSpent": sum(p["amount"] for p in paid),
        "totalPayments": len(paid),
        "recent": recent,
    }


class DashboardService:
    @property
    def cards(self):
        return getDB()["Card"]

    async def GetDashboard(self, user: dict):
        ownerId = str(user["_id"])
        now = datetime.now(timezone.utc)
        eventDatePath = "_details.specificDetails.eventDate"

        # One round trip: join each card with its details + template, then split
        # the same joined set into several result groups with $facet.
        pipeline = [
            {"$match": {"ownerId": ownerId}},
            {
                "$addFields": {
                    "_detailsOid": _toOid("$cardDetailsId"),
                    "_templateOid": _toOid("$templateId"),
                }
            },
            {
                "$lookup": {
                    "from": "CardDetails",
                    "localField": "_detailsOid",
                    "foreignField": "_id",
                    "as": "_details",
                }
            },
            {
                "$lookup": {
                    "from": "Template",
                    "localField": "_templateOid",
                    "foreignField": "_id",
                    "as": "_template",
                }
            },
            {
                "$addFields": {
                    "_details": {"$arrayElemAt": ["$_details", 0]},
                    "_template": {"$arrayElemAt": ["$_template", 0]},
                }
            },
            {
                "$facet": {
                    "totals": [
                        {
                            "$group": {
                                "_id": None,
                                "totalCards": {"$sum": 1},
                                "draftCards": {
                                    "$sum": {"$cond": [{"$eq": ["$status", "draft"]}, 1, 0]}
                                },
                                "publishedCards": {
                                    "$sum": {
                                        "$cond": [{"$eq": ["$status", "published"]}, 1, 0]
                                    }
                                },
                                "paidCards": {"$sum": {"$cond": ["$isPaid", 1, 0]}},
                                "totalViews": {"$sum": "$viewCount"},
                                "totalRsvps": {"$sum": "$rsvpCount"},
                            }
                        }
                    ],
                    "byCategory": [
                        {"$group": {"_id": "$_template.category", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                    ],
                    "upcomingCount": [
                        {"$match": {eventDatePath: {"$gte": now}}},
                        {"$count": "n"},
                    ],
                    "nextEvent": [
                        {"$match": {eventDatePath: {"$gte": now}}},
                        {"$sort": {eventDatePath: 1}},
                        {"$limit": 1},
                        {
                            "$project": {
                                "templateSlug": "$_template.slug",
                                "details": "$_details.specificDetails",
                            }
                        },
                    ],
                    "recent": [
                        # Card docs are inserted without createAt, so ObjectId order
                        # (which embeds creation time) is the reliable "newest first".
                        {"$sort": {"_id": -1}},
                        {"$limit": RECENT_CARDS_LIMIT},
                        {
                            "$project": {
                                "publicSlug": 1,
                                "status": 1,
                                "isPaid": 1,
                                "viewCount": 1,
                                "rsvpCount": 1,
                                "createdAt": {"$toDate": "$_id"},
                                "details": "$_details.specificDetails",
                                "category": "$_template.category",
                                "templateName": "$_template.templateName",
                                "templateSlug": "$_template.slug",
                                "thumbnailUrl": "$_template.thumbnail_url",
                            }
                        },
                    ],
                }
            },
        ]

        rows = await self.cards.aggregate(pipeline).to_list(length=1)
        facet = rows[0] if rows else {}

        totals = (facet.get("totals") or [{}])[0]
        upcoming = (facet.get("upcomingCount") or [{}])[0].get("n", 0)
        recentCards = [_serializeCard(c) for c in facet.get("recent", [])]

        nextEvent = None
        if facet.get("nextEvent"):
            ev = facet["nextEvent"][0]
            details = ev.get("details") or {}
            nextEvent = {
                "cardId": str(ev["_id"]),
                "templateSlug": ev.get("templateSlug"),
                "title": _cardTitle(details),
                "eventDate": _iso(details.get("eventDate")),
            }

        cardsByCategory = [
            {"category": row["_id"], "count": row["count"]}
            for row in facet.get("byCategory", [])
            if row["_id"]
        ]

        return response(
            message="Dashboard fetched successfully",
            data={
                "user": {
                    "name": user.get("full_name", ""),
                    "email": user.get("email", ""),
                    "avatar": user.get("avatar"),
                },
                "stats": {
                    "totalCards": totals.get("totalCards", 0),
                    "draftCards": totals.get("draftCards", 0),
                    "publishedCards": totals.get("publishedCards", 0),
                    "paidCards": totals.get("paidCards", 0),
                    "totalViews": totals.get("totalViews", 0),
                    "totalRsvps": totals.get("totalRsvps", 0),
                    "upcomingEvents": upcoming,
                },
                "cardsByCategory": cardsByCategory,
                "nextEvent": nextEvent,
                "recentCards": recentCards,
                "payments": _demoPayments(recentCards),
            },
        )


dashboard_service = DashboardService()