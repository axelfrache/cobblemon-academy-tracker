import httpx
import logging
from datetime import datetime, timedelta, timezone
from cobblemon_academy_tracker_api.database import get_collection

logger = logging.getLogger("uvicorn")

CACHE_DURATION_DAYS = 7
MOJANG_SESSION_URL = "https://sessionserver.mojang.com/session/minecraft/profile/"

async def resolve_username(uuid: str) -> str:
    """
    Resolves a UUID to a Minecraft username using a local cache and the Mojang API.
    """
    clean_uuid = uuid.replace("-", "")
    collection = get_collection("UserCache")
    
    cached = await collection.find_one({"uuid": uuid})
    if cached:
        updated_at = cached.get("updated_at")
        if updated_at.tzinfo is None:
             updated_at = updated_at.replace(tzinfo=timezone.utc)
             
        if datetime.now(timezone.utc) - updated_at < timedelta(days=CACHE_DURATION_DAYS):
            return cached.get("username", "Unknown Trainer")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MOJANG_SESSION_URL}{clean_uuid}")
            
            if response.status_code == 200:
                data = response.json()
                username = data.get("name")
                
                await collection.update_one(
                    {"uuid": uuid},
                    {"$set": {
                        "username": username,
                        "updated_at": datetime.now(timezone.utc)
                    }},
                    upsert=True
                )
                return username
            elif response.status_code == 204:
                logger.warning(f"UUID {uuid} not found on Mojang servers.")
            else:
                logger.error(f"Mojang API error {response.status_code} for {uuid}")
                
    except Exception as e:
        logger.error(f"Failed to resolve username for {uuid}: {e}")

    if cached and "username" in cached:
        return cached["username"]
        
    return "Unknown Trainer"
