from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

app = FastAPI()

# Placeholder for MongoDB connection
# client = AsyncIOMotorClient("mongodb://localhost:27017")
# db = client.cobblemon_academy

@app.get("/")
async def read_root():
    return {"message": "Hello World"}
