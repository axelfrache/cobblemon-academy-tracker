from typing import List, Dict
from datetime import datetime, timedelta
from fastapi import APIRouter
from cobblemon_academy_tracker_api.database import get_collection
from cobblemon_academy_tracker_api.schemas import LeaderboardEntry, AcademyRankEntry
from cobblemon_academy_tracker_api.services import resolve_username

router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


async def get_pokedex_leaderboard(limit: int = 10) -> List[LeaderboardEntry]:
    scores = await _scan_collections_for_pokedex()
    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:limit]

    results = []
    for i, (uuid, value) in enumerate(sorted_items, start=1):
        username = await resolve_username(uuid)
        results.append(
            LeaderboardEntry(uuid=uuid, username=username, value=value, rank=i)
        )
    return results


async def get_shiny_leaderboard(limit: int = 10) -> List[LeaderboardEntry]:
    scores = await _scan_collections_for_shiny()
    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:limit]

    results = []
    for i, (uuid, value) in enumerate(sorted_items, start=1):
        username = await resolve_username(uuid)
        results.append(
            LeaderboardEntry(uuid=uuid, username=username, value=value, rank=i)
        )
    return results


@router.get("/academy", response_model=List[AcademyRankEntry])
async def get_academy_endpoint(limit: int = 100):
    try:
        print("Calculating Academy Ranks...")
        results = await get_academy_leaderboard(limit)
        print(f"Calculation done. Got {len(results)} results.")
        return results
    except Exception as e:
        import traceback

        traceback.print_exc()
        print(f"ERROR computing academy ranks: {e}")
        raise e


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


ACADEMY_CACHE: Dict = {"data": None, "expires_at": datetime.min}
CACHE_TTL_SECONDS = 300


async def get_cached_academy_ranks() -> List[AcademyRankEntry]:
    if ACADEMY_CACHE["data"] and datetime.now() < ACADEMY_CACHE["expires_at"]:
        return ACADEMY_CACHE["data"]

    results = await calculate_academy_ranks()

    ACADEMY_CACHE["data"] = results
    ACADEMY_CACHE["expires_at"] = datetime.now() + timedelta(seconds=CACHE_TTL_SECONDS)

    return results


async def get_academy_leaderboard(limit: int = 100) -> List[AcademyRankEntry]:
    results = await get_cached_academy_ranks()
    return results[:limit]


async def calculate_academy_ranks() -> List[AcademyRankEntry]:
    W_POKEDEX = 0.35
    W_SHINY = 0.30
    W_BATTLES = 0.25
    W_EGGS = 0.10

    pokedex_scores = await _get_all_pokedex_scores()
    shiny_scores = await _get_all_shiny_scores()
    battle_scores = await _get_all_basic_scores(
        "advancementData.totalBattleVictoryCount"
    )
    egg_scores = await _get_all_basic_scores("advancementData.totalEggsHatched")

    all_uuids = (
        set(pokedex_scores.keys())
        | set(shiny_scores.keys())
        | set(battle_scores.keys())
        | set(egg_scores.keys())
    )
    total_players = len(all_uuids)

    if total_players == 0:
        return []

    def compute_ranks(scores: Dict[str, float]) -> Dict[str, int]:
        sorted_uuid = sorted(all_uuids, key=lambda u: scores.get(u, 0), reverse=True)
        ranks = {}
        current_rank = 1
        for i, uuid in enumerate(sorted_uuid):
            if i > 0 and scores.get(uuid, 0) < scores.get(sorted_uuid[i - 1], 0):
                current_rank = i + 1
            ranks[uuid] = current_rank
        return ranks

    rank_pokedex = compute_ranks(pokedex_scores)
    rank_shiny = compute_ranks(shiny_scores)
    rank_battles = compute_ranks(battle_scores)
    rank_eggs = compute_ranks(egg_scores)

    academy_entries = []

    for uuid in all_uuids:

        def get_norm(rank: int, raw_val: float) -> float:
            if raw_val == 0:
                return 0.0
            if total_players <= 1:
                return 1.0
            return 1.0 - (rank - 1) / (total_players - 1)

        norm_pokedex = get_norm(rank_pokedex[uuid], pokedex_scores.get(uuid, 0))
        norm_shiny = get_norm(rank_shiny[uuid], shiny_scores.get(uuid, 0))
        norm_battles = get_norm(rank_battles[uuid], battle_scores.get(uuid, 0))
        norm_eggs = get_norm(rank_eggs[uuid], egg_scores.get(uuid, 0))

        raw_score = (
            W_POKEDEX * norm_pokedex
            + W_SHINY * norm_shiny
            + W_BATTLES * norm_battles
            + W_EGGS * norm_eggs
        )
        final_score = round(raw_score * 100, 2)

        academy_entries.append(
            {
                "uuid": uuid,
                "score": final_score,
                "ranks": {
                    "pokedex": rank_pokedex[uuid],
                    "shiny": rank_shiny[uuid],
                    "battles": rank_battles[uuid],
                    "eggs": rank_eggs[uuid],
                },
                "normalized": {
                    "pokedex": norm_pokedex,
                    "shiny": norm_shiny,
                    "battles": norm_battles,
                    "eggs": norm_eggs,
                },
            }
        )

    academy_entries.sort(key=lambda x: x["score"], reverse=True)

    final_results = []
    for i, entry in enumerate(academy_entries, start=1):
        username = await resolve_username(entry["uuid"])
        final_results.append(
            AcademyRankEntry(
                uuid=entry["uuid"],
                username=username,
                academyRank=i,
                academyScore=entry["score"],
                ranks=entry["ranks"],
                normalized=entry["normalized"],
                totalPlayers=total_players,
            )
        )

    return final_results


async def _get_all_pokedex_scores() -> Dict[str, float]:
    return await _scan_collections_for_pokedex()


async def _get_all_shiny_scores() -> Dict[str, float]:
    return await _scan_collections_for_shiny()


async def _get_all_basic_scores(field_path: str) -> Dict[str, float]:
    collection = get_collection("PlayerDataCollection")
    cursor = collection.aggregate(
        [{"$project": {"uuid": 1, "value": f"${field_path}"}}]
    )
    scores = {}
    async for doc in cursor:
        scores[doc["uuid"]] = float(doc.get("value", 0))
    return scores


async def _scan_collections_for_pokedex() -> Dict[str, int]:
    party_collection = get_collection("PlayerPartyCollection")
    pc_collection = get_collection("PCCollection")
    player_species: dict[str, set[str]] = {}

    async for doc in party_collection.find({}):
        uuid = doc.get("uuid")
        if not uuid:
            continue
        if uuid not in player_species:
            player_species[uuid] = set()
        for i in range(6):
            slot = doc.get(f"Slot{i}")
            if slot and "Species" in slot:
                player_species[uuid].add(slot["Species"].lower())

    async for doc in pc_collection.find({}):
        uuid = doc.get("uuid")
        if not uuid:
            continue
        if uuid not in player_species:
            player_species[uuid] = set()

        for key, val in doc.items():
            if key.startswith("Box") and isinstance(val, dict):
                for slot_key, pokemon in val.items():
                    if slot_key.startswith("Slot") and isinstance(pokemon, dict):
                        s = pokemon.get("Species")
                        if s:
                            player_species[uuid].add(s.lower())

    return {k: len(v) for k, v in player_species.items()}


async def _scan_collections_for_shiny() -> Dict[str, int]:
    party_collection = get_collection("PlayerPartyCollection")
    pc_collection = get_collection("PCCollection")
    player_shinies: dict[str, int] = {}

    def add_shiny(uid, is_shiny):
        if is_shiny:
            player_shinies[uid] = player_shinies.get(uid, 0) + 1
        elif uid not in player_shinies:
            player_shinies[uid] = 0

    async for doc in party_collection.find({}):
        uuid = doc.get("uuid")
        if not uuid:
            continue
        add_shiny(uuid, False)
        for i in range(6):
            slot = doc.get(f"Slot{i}")
            if slot and slot.get("Shiny"):
                add_shiny(uuid, True)

    async for doc in pc_collection.find({}):
        uuid = doc.get("uuid")
        if not uuid:
            continue
        add_shiny(uuid, False)
        for key, val in doc.items():
            if key.startswith("Box") and isinstance(val, dict):
                for slot, poke in val.items():
                    if slot.startswith("Slot") and isinstance(poke, dict):
                        if poke.get("Shiny"):
                            add_shiny(uuid, True)
    return player_shinies
