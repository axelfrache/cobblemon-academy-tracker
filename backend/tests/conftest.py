import pytest
import json
import os
from unittest.mock import MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from cobblemon_academy_tracker_api.main import app
from cobblemon_academy_tracker_api import database

# Load sample data
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_FILES = {
    "PlayerDataCollection": "PlayerDataCollection.json",
    "PlayerPartyCollection": "PlayerPartyCollection.json",
    "PCCollection": "PCCollection.json",
    "PokeDexCollection": "PokeDexCollection.json",
}


def load_json(filename):
    path = os.path.join(PROJECT_ROOT, filename)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []


MOCK_DB = {name: load_json(file) for name, file in DATA_FILES.items()}


@pytest.fixture
def mock_mongo():
    # Create a mock for the database functionality
    mock_get_collection = MagicMock()

    def side_effect(collection_name):
        mock_collection = AsyncMock()

        data = MOCK_DB.get(collection_name, [])

        # Mock find_one
        async def find_one(query):
            # Simple exact match for uuid if present
            target_uuid = query.get("uuid")
            if target_uuid:
                for doc in data:
                    if doc.get("uuid") == target_uuid:
                        return doc
            return None

        mock_collection.find_one = find_one

        # Mock aggregate (for leaderboards)
        # We need to simulate the pipeline logic slightly to return meaningful data
        # or just return the data sorted by the field requested.

        class MockCursor:
            def __init__(self, data):
                self.data = data
                self.idx = 0

            def __aiter__(self):
                return self

            async def __anext__(self):
                if self.idx < len(self.data):
                    item = self.data[self.idx]
                    self.idx += 1
                    return item
                raise StopAsyncIteration

        def aggregate(pipeline):
            # Very basic extraction of sort field from pipeline
            # Pipeline is usually [ {$sort: ...}, {$limit: ...}, {$project: ...} ]

            dataset = data[:]

            # 1. Sort
            sort_stage = next((s for s in pipeline if "$sort" in s), None)
            if sort_stage:
                sort_dict = sort_stage["$sort"]
                field = list(sort_dict.keys())[0]
                descending = sort_dict[field] == -1

                # Handle flattened fields like "advancementData.totalCaptureCount"
                def get_val(obj, path):
                    parts = path.split(".")
                    curr = obj
                    for p in parts:
                        if isinstance(curr, dict):
                            curr = curr.get(p, 0)
                        else:
                            return 0
                    return curr

                dataset.sort(key=lambda x: get_val(x, field), reverse=descending)

            # 2. Limit
            limit_stage = next((s for s in pipeline if "$limit" in s), None)
            if limit_stage:
                limit = limit_stage["$limit"]
                dataset = dataset[:limit]

            # 3. Project (simplified: just return minimal as per leaderboard schemas)
            # project_stage = next((s for s in pipeline if "$project" in s), None)
            projected_data = []
            for doc in dataset:
                val = 0
                if sort_stage:
                    field = list(sort_dict.keys())[0]
                    val = get_val(doc, field)

                projected_data.append(
                    {
                        "uuid": doc.get("uuid"),
                        "username": doc.get("username"),
                        "value": val,
                    }
                )

            return MockCursor(projected_data)

        mock_collection.aggregate = MagicMock(side_effect=aggregate)

        return mock_collection

    mock_get_collection.side_effect = side_effect
    return mock_get_collection


@pytest.fixture
async def client(mock_mongo, monkeypatch):
    # Patch the get_collection function in the routers/imports
    # Because endpoints import it from database.py, we patch it there
    monkeypatch.setattr(database, "get_collection", mock_mongo)

    # Also patch connect/close to do nothing
    monkeypatch.setattr(database, "connect_to_mongo", AsyncMock())
    monkeypatch.setattr(database, "close_mongo_connection", AsyncMock())

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
