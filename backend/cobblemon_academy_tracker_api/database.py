import os
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Request

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def get_database() -> AsyncIOMotorClient:
    return db.client[DB_NAME]

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(MONGO_URL)
    print("Connected to MongoDB")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")

def get_collection(collection_name: str):
    return db.client[DB_NAME][collection_name]
