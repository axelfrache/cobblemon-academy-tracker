from typing import List, Optional
from fastapi import APIRouter, HTTPException
from cobblemon_academy_tracker_api.database import get_collection
from cobblemon_academy_tracker_api.schemas import (
    PlayerSummary,
    Pokemon,
    PokedexStats,
    AcademyRankEntry,
)

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/{uuid}/summary", response_model=PlayerSummary)
async def get_player_summary(uuid: str):
    collection = get_collection("PlayerDataCollection")
    player_doc = await collection.find_one({"uuid": uuid})

    if not player_doc:
        raise HTTPException(status_code=404, detail="Player not found")

    from cobblemon_academy_tracker_api.services import resolve_username

    real_username = await resolve_username(uuid)
    player_doc["username"] = real_username

    return PlayerSummary(**player_doc)


@router.get("/{uuid}/party", response_model=List[Pokemon])
async def get_player_party(uuid: str):
    collection = get_collection("PlayerPartyCollection")
    party_doc = await collection.find_one({"uuid": uuid})

    if not party_doc:
        raise HTTPException(status_code=404, detail="Player party not found")

    party_pokemon = []
    for i in range(6):
        key = f"Slot{i}"
        if key in party_doc and party_doc[key]:
            data = party_doc[key]
            if "Species" in data:
                party_pokemon.append(Pokemon(**data))

    return party_pokemon


@router.get("/{uuid}/pc", response_model=List[Pokemon])
async def get_player_pc(
    uuid: str,
    page: int = 1,
    limit: int = 50,
    shiny: Optional[bool] = None,
    species: Optional[str] = None,
):
    collection = get_collection("PCCollection")
    pc_doc = await collection.find_one({"uuid": uuid})

    if not pc_doc:
        raise HTTPException(status_code=404, detail="Player PC not found")

    all_pokemon = []
    box_count = pc_doc.get("BoxCount", 50)

    for box_idx in range(box_count):
        box_key = f"Box{box_idx}"
        box_data = pc_doc.get(box_key, {})
        if not box_data:
            continue

        for slot_key, pokemon_data in box_data.items():
            if not slot_key.startswith("Slot"):
                continue

            if not isinstance(pokemon_data, dict) or "Species" not in pokemon_data:
                continue

            if shiny is not None and pokemon_data.get("Shiny", False) != shiny:
                continue

            if species:
                if species.lower() not in pokemon_data.get("Species", "").lower():
                    continue

            try:
                p_obj = Pokemon(**pokemon_data)
                p_obj.boxIndex = box_idx
                p_obj.slotIndex = int(slot_key.replace("Slot", ""))
                all_pokemon.append(p_obj)
            except Exception:
                continue

    start = (page - 1) * limit
    end = start + limit
    return all_pokemon[start:end]


@router.get("/{uuid}/pokedex", response_model=PokedexStats)
async def get_player_pokedex(uuid: str):
    from cobblemon_academy_tracker_api.constants import TOTAL_COBBLEMON_SPECIES

    party_collection = get_collection("PlayerPartyCollection")
    pc_collection = get_collection("PCCollection")

    owned_species: set[str] = set()

    party_doc = await party_collection.find_one({"uuid": uuid})
    if party_doc:
        for i in range(6):
            slot_key = f"Slot{i}"
            if slot_key in party_doc and party_doc[slot_key]:
                species = party_doc[slot_key].get("Species")
                if species:
                    owned_species.add(species.lower())

    pc_doc = await pc_collection.find_one({"uuid": uuid})
    if pc_doc:
        box_count = pc_doc.get("BoxCount", 50)
        for box_idx in range(box_count):
            box_key = f"Box{box_idx}"
            box_data = pc_doc.get(box_key, {})
            if not box_data:
                continue
            for slot_key, pokemon_data in box_data.items():
                if not slot_key.startswith("Slot"):
                    continue
                if isinstance(pokemon_data, dict):
                    species = pokemon_data.get("Species")
                    if species:
                        owned_species.add(species.lower())

    total_caught = len(owned_species)
    completion_percentage = round((total_caught / TOTAL_COBBLEMON_SPECIES) * 100, 2)

    return PokedexStats(
        total_seen=total_caught,
        total_caught=total_caught,
        completion_percentage=completion_percentage,
    )


@router.get("/{uuid}/rank", response_model=AcademyRankEntry)
async def get_player_rank(uuid: str):
    from cobblemon_academy_tracker_api.routers.leaderboards import (
        get_cached_academy_ranks,
    )

    ranks = await get_cached_academy_ranks()
    for entry in ranks:
        if entry.uuid == uuid:
            return entry

    raise HTTPException(status_code=404, detail="Player rank data not found")
