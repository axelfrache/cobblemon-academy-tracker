from typing import List, Dict, Optional, Union
from pydantic import BaseModel, Field

# --- Common Models ---


class IVs(BaseModel):
    hp: int = Field(alias="cobblemon:hp", default=0)
    attack: int = Field(alias="cobblemon:attack", default=0)
    defence: int = Field(alias="cobblemon:defence", default=0)
    special_attack: int = Field(alias="cobblemon:special_attack", default=0)
    special_defence: int = Field(alias="cobblemon:special_defence", default=0)
    speed: int = Field(alias="cobblemon:speed", default=0)

    class Config:
        populate_by_name = True


class EVs(BaseModel):
    hp: int = Field(alias="cobblemon:hp", default=0)
    attack: int = Field(alias="cobblemon:attack", default=0)
    defence: int = Field(alias="cobblemon:defence", default=0)
    special_attack: int = Field(alias="cobblemon:special_attack", default=0)
    special_defence: int = Field(alias="cobblemon:special_defence", default=0)
    speed: int = Field(alias="cobblemon:speed", default=0)

    class Config:
        populate_by_name = True


class Move(BaseModel):
    MoveName: str
    MovePP: int
    RaisedPPStages: int


class Ability(BaseModel):
    AbilityName: str
    AbilityIndex: int
    AbilityPriority: Optional[str] = None


class Pokemon(BaseModel):
    Species: str
    Level: int
    Experience: int
    Gender: str
    Shiny: bool = False
    Nature: str
    Ability: Ability
    IVs: IVs
    EVs: EVs
    MoveSet: List[Move] = []
    Health: int
    Friendship: int
    FormId: str = "normal"
    TeraType: Optional[str] = None
    CaughtBall: str
    ScaleModifier: float = 1.0
    OriginalTrainer: Optional[str] = Field(alias="PokemonOriginalTrainer", default=None)

    # Extra fields for context (PC)
    boxIndex: Optional[int] = None
    slotIndex: Optional[int] = None

    class Config:
        populate_by_name = True
        extra = "ignore"


# --- Player Summary ---


class AdvancementData(BaseModel):
    totalCaptureCount: int = 0
    totalShinyCaptureCount: int = 0
    totalEggsCollected: int = 0
    totalEggsHatched: int = 0
    totalEvolvedCount: int = 0
    totalBattleVictoryCount: int = 0
    totalPvPBattleVictoryCount: int = 0
    totalPvWBattleVictoryCount: int = 0
    totalPvNBattleVictoryCount: int = 0
    totalTypeCaptureCounts: Dict[str, int] = {}
    aspectsCollected: Dict[str, List[str]] = {}

    class Config:
        extra = "ignore"


class PlayerSummary(BaseModel):
    uuid: str
    advancementData: AdvancementData
    username: Optional[str] = None

    class Config:
        extra = "ignore"


# --- Leaderboard ---


class LeaderboardEntry(BaseModel):
    uuid: str
    username: Optional[str] = None
    value: Union[int, float]
    rank: int


# --- Pokedex ---


class DexEntry(BaseModel):
    species: str
    caught: bool
    seen: bool
    shinies_caught: bool = False


class PokedexStats(BaseModel):
    total_seen: int
    total_caught: int
    completion_percentage: float
    missing_species: List[str] = []
