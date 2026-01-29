from typing import List
from fastapi import APIRouter
from cobblemon_academy_tracker_api.database import get_collection
from cobblemon_academy_tracker_api.schemas import LeaderboardEntry

router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


@router.get("/{category}", response_model=List[LeaderboardEntry])
async def get_leaderboard(category: str, limit: int = 10):
    collection = get_collection("PlayerDataCollection")

    sort_field = ""

    if category == "shiny":
        sort_field = "advancementData.totalShinyCaptureCount"
    elif category == "captures":
        sort_field = "advancementData.totalCaptureCount"
    elif category == "battles":
        sort_field = "advancementData.totalBattleVictoryCount"
    elif category == "breeders":
        sort_field = "advancementData.totalEggsHatched"
    elif category == "aspects":
        pass
    else:
        return []

    pipeline = []

    if category == "aspects":
        pipeline = [
            {
                "$project": {
                    "uuid": 1,
                    "value": {
                        "$size": {"$objectToArray": "$advancementData.aspectsCollected"}
                    },
                }
            },
            {"$sort": {"value": -1}},
            {"$limit": limit},
        ]
    else:
        pipeline = [
            {"$sort": {sort_field: -1}},
            {"$limit": limit},
            {"$project": {"uuid": 1, "value": f"${sort_field}"}},
        ]

    cursor = collection.aggregate(pipeline)

    from cobblemon_academy_tracker_api.services import resolve_username

    results = []
    rank = 1
    async for doc in cursor:
        username = await resolve_username(doc["uuid"])
        results.append(
            LeaderboardEntry(
                uuid=doc["uuid"],
                username=username,
                value=doc.get("value", 0),
                rank=rank,
            )
        )
        rank += 1

    return results
