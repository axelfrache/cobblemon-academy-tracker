from typing import List
from fastapi import APIRouter
from cobblemon_academy_tracker_api.database import get_collection
from cobblemon_academy_tracker_api.schemas import LeaderboardEntry

router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


@router.get("/{category}", response_model=List[LeaderboardEntry])
async def get_leaderboard(category: str, limit: int = 10):
    if category == "pokedex":
        return await get_pokedex_leaderboard(limit)

    if category == "shiny":
        return await get_shiny_leaderboard(limit)

    collection = get_collection("PlayerDataCollection")

    sort_field = ""

    if category == "captures":
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


async def get_pokedex_leaderboard(limit: int = 10) -> List[LeaderboardEntry]:
    from cobblemon_academy_tracker_api.services import resolve_username

    party_collection = get_collection("PlayerPartyCollection")
    pc_collection = get_collection("PCCollection")

    player_species: dict[str, set[str]] = {}

    party_cursor = party_collection.find({})
    async for doc in party_cursor:
        uuid = doc.get("uuid")
        if not uuid:
            continue
        if uuid not in player_species:
            player_species[uuid] = set()

        for i in range(6):
            slot_key = f"Slot{i}"
            if slot_key in doc and doc[slot_key]:
                species = doc[slot_key].get("Species")
                if species:
                    player_species[uuid].add(species.lower())

    pc_cursor = pc_collection.find({})
    async for doc in pc_cursor:
        uuid = doc.get("uuid")
        if not uuid:
            continue
        if uuid not in player_species:
            player_species[uuid] = set()

        box_count = doc.get("BoxCount", 50)
        for box_idx in range(box_count):
            box_key = f"Box{box_idx}"
            box_data = doc.get(box_key, {})
            if not box_data:
                continue
            for slot_key, pokemon_data in box_data.items():
                if not slot_key.startswith("Slot"):
                    continue
                if isinstance(pokemon_data, dict):
                    species = pokemon_data.get("Species")
                    if species:
                        player_species[uuid].add(species.lower())

    sorted_players = sorted(
        player_species.items(), key=lambda x: len(x[1]), reverse=True
    )[:limit]

    results = []
    for rank, (uuid, species_set) in enumerate(sorted_players, start=1):
        username = await resolve_username(uuid)
        results.append(
            LeaderboardEntry(
                uuid=uuid,
                username=username,
                value=len(species_set),
                rank=rank,
            )
        )

    return results


async def get_shiny_leaderboard(limit: int = 10) -> List[LeaderboardEntry]:
    from cobblemon_academy_tracker_api.services import resolve_username

    party_collection = get_collection("PlayerPartyCollection")
    pc_collection = get_collection("PCCollection")

    player_shinies: dict[str, int] = {}

    party_cursor = party_collection.find({})
    async for doc in party_cursor:
        uuid = doc.get("uuid")
        if not uuid:
            continue
        if uuid not in player_shinies:
            player_shinies[uuid] = 0

        for i in range(6):
            slot_key = f"Slot{i}"
            if slot_key in doc and doc[slot_key]:
                if doc[slot_key].get("Shiny", False):
                    player_shinies[uuid] += 1

    pc_cursor = pc_collection.find({})
    async for doc in pc_cursor:
        uuid = doc.get("uuid")
        if not uuid:
            continue
        if uuid not in player_shinies:
            player_shinies[uuid] = 0

        box_count = doc.get("BoxCount", 50)
        for box_idx in range(box_count):
            box_key = f"Box{box_idx}"
            box_data = doc.get(box_key, {})
            if not box_data:
                continue
            for slot_key, pokemon_data in box_data.items():
                if not slot_key.startswith("Slot"):
                    continue
                if isinstance(pokemon_data, dict):
                    if pokemon_data.get("Shiny", False):
                        player_shinies[uuid] += 1

    sorted_players = sorted(player_shinies.items(), key=lambda x: x[1], reverse=True)[
        :limit
    ]

    results = []
    for rank, (uuid, shiny_count) in enumerate(sorted_players, start=1):
        username = await resolve_username(uuid)
        results.append(
            LeaderboardEntry(
                uuid=uuid,
                username=username,
                value=shiny_count,
                rank=rank,
            )
        )

    return results
