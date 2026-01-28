import math
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from cobblemon_academy_tracker_api.database import get_collection
from cobblemon_academy_tracker_api.schemas import PlayerSummary, Pokemon, PokedexStats

router = APIRouter(prefix="/players", tags=["players"])

@router.get("/{uuid}/summary", response_model=PlayerSummary)
async def get_player_summary(uuid: str):
    collection = get_collection("PlayerDataCollection")
    player_doc = await collection.find_one({"uuid": uuid})
    
    if not player_doc:
        raise HTTPException(status_code=404, detail="Player not found")
    
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
    species: Optional[str] = None
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
    collection = get_collection("PokeDexCollection")
    dex_doc = await collection.find_one({"uuid": uuid})
    
    if not dex_doc:
        return PokedexStats(total_seen=0, total_caught=0, completion_percentage=0.0)
    
    records = dex_doc.get("speciesRecords", {})
    
    total_seen = 0
    total_caught = 0
    
    for species, record in records.items():
        is_caught = False
        is_seen = False
        
        form_records = record.get("formRecords", {})
        for form, data in form_records.items():
            k = data.get("knowledge", "NONE")
            if k == "CAUGHT":
                is_caught = True
                is_seen = True # Implicit
            elif k == "SEEN":
                is_seen = True
        
        if is_caught:
            total_caught += 1
            total_seen += 1
        elif is_seen:
            total_seen += 1
            
    return PokedexStats(
        total_seen=total_seen,
        total_caught=total_caught,
        completion_percentage=0.0
    )
