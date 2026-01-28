from contextlib import asynccontextmanager
from fastapi import FastAPI
from cobblemon_academy_tracker_api.database import connect_to_mongo, close_mongo_connection
from cobblemon_academy_tracker_api.routers import players, leaderboards

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

app.include_router(players.router)
app.include_router(leaderboards.router)

@app.get("/")
async def read_root():
    return {"message": "Cobblemon Academy Tracker API"}
