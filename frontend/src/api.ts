const BASE_URL = import.meta.env.PROD ? "/api" : "http://localhost:8000";

export interface PlayerSummary {
    uuid: string;
    name: string;
    rank: number;
    totalCaptures: number;
    shinyCount: number;
    battlesWon: number;
    pokedexCompletion: number;
    pokedexCount: number;
}

export interface Pokemon {
    species: string;
    level: number;
    shiny: boolean;
    types: string[];
    sprite: string;
    ability?: string;
    nature?: string;
    ivs?: Record<string, number>;
    boxIndex?: number;
    slotIndex?: number;
}

export type PlayerPartyMember = Pokemon;

export interface LeaderboardEntry {
    uuid: string;
    name: string;
    value: number;
    avatar: string;
    rank: number;
}

interface BackendLeaderboardEntry {
    uuid: string;
    username: string;
    value: number;
    rank: number;
}

interface BackendPlayerSummary {
    uuid: string;
    username: string;
    advancementData: {
        totalCaptureCount: number;
        totalShinyCaptureCount: number;
        totalBattleVictoryCount: number;
    };
}

interface BackendPokemon {
    Species: string;
    Level: number;
    Shiny: boolean;
    Nature: string;
    Ability: { AbilityName: string };
    IVs: { [key: string]: number };
    Gender: string;
}

export const api = {
    getLeaderboard: async (category: "shiny" | "captures" | "battles" | "pokedex"): Promise<LeaderboardEntry[]> => {
        try {
            const res = await fetch(`${BASE_URL}/leaderboards/${category}`);
            if (!res.ok) throw new Error("Failed to fetch leaderboard");
            const data: BackendLeaderboardEntry[] = await res.json();

            return data.map(entry => ({
                uuid: entry.uuid,
                name: entry.username || "Unknown",
                value: entry.value,
                avatar: `https://minotar.net/avatar/${entry.username || 'steve'}`,
                rank: entry.rank
            }));
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getAcademyLeaderboard: async (limit = 100): Promise<AcademyRankEntry[]> => {
        try {
            const res = await fetch(`${BASE_URL}/leaderboards/academy?limit=${limit}`);
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getPlayerRank: async (uuid: string): Promise<AcademyRankEntry | null> => {
        try {
            const res = await fetch(`${BASE_URL}/players/${uuid}/rank`);
            if (!res.ok) return null;
            return await res.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    getPlayer: async (uuid: string): Promise<PlayerSummary | null> => {
        try {
            const [summaryRes, leaderboard, pokedexRes] = await Promise.all([
                fetch(`${BASE_URL}/players/${uuid}/summary`),
                api.getLeaderboard("captures"),
                fetch(`${BASE_URL}/players/${uuid}/pokedex`)
            ]);

            if (!summaryRes.ok) return null;
            const data: BackendPlayerSummary = await summaryRes.json();

            const rankEntry = leaderboard.find(e => e.uuid === uuid);
            const rank = rankEntry ? rankEntry.rank : 0;

            let pokedexCompletion = 0;
            let pokedexCount = 0;
            if (pokedexRes.ok) {
                const pokedexData = await pokedexRes.json();
                pokedexCompletion = pokedexData.completion_percentage ?? 0;
                pokedexCount = pokedexData.total_caught ?? 0;
            }

            return {
                uuid: data.uuid,
                name: data.username || "Unknown",
                rank: rank,
                totalCaptures: data.advancementData?.totalCaptureCount ?? 0,
                shinyCount: data.advancementData?.totalShinyCaptureCount ?? 0,
                battlesWon: data.advancementData?.totalBattleVictoryCount ?? 0,
                pokedexCompletion: pokedexCompletion,
                pokedexCount: pokedexCount,
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    getPlayerParty: async (uuid: string): Promise<PlayerPartyMember[]> => {
        try {
            const res = await fetch(`${BASE_URL}/players/${uuid}/party`);
            if (!res.ok) return [];
            const data: BackendPokemon[] = await res.json();

            return data.map(p => transformBackendPokemon(p));
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getPlayerPC: async (uuid: string, page = 1, searchQuery?: string, filters?: { shiny?: boolean }): Promise<Pokemon[]> => {
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", "50");

            if (searchQuery) params.append("species", searchQuery);
            if (filters?.shiny !== undefined) params.append("shiny", filters.shiny.toString());

            const res = await fetch(`${BASE_URL}/players/${uuid}/pc?${params.toString()}`);
            if (!res.ok) return [];
            const data: BackendPokemon[] = await res.json();
            return data.map(p => transformBackendPokemon(p));
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getServerStats: async () => {
        try {
            const [captures, shiny, battles, academy] = await Promise.all([
                api.getLeaderboard("captures"),
                api.getLeaderboard("shiny"),
                api.getLeaderboard("battles"),
                api.getAcademyLeaderboard(10)
            ]);

            const totalCaptures = captures.reduce((acc, curr) => acc + curr.value, 0);
            const totalShinies = shiny.reduce((acc, curr) => acc + curr.value, 0);
            const totalBattles = battles.reduce((acc, curr) => acc + curr.value, 0);
            const activeTrainers = new Set([
                ...captures.map(e => e.uuid),
                ...shiny.map(e => e.uuid),
                ...battles.map(e => e.uuid)
            ]).size;

            const featuredTrainers: LeaderboardEntry[] = academy.map(entry => ({
                uuid: entry.uuid,
                name: entry.username || "Unknown",
                value: entry.academyScore,
                avatar: `https://minotar.net/avatar/${entry.username || 'steve'}`,
                rank: entry.academyRank
            }));

            return {
                totalCaptures,
                totalShinies,
                totalBattles,
                activeTrainers,
                topShinies: shiny.slice(0, 5),
                recentTrainers: featuredTrainers,
            };
        } catch (error) {
            console.error(error);
            return {
                totalCaptures: 0,
                totalShinies: 0,
                totalBattles: 0,
                activeTrainers: 0,
                topShinies: [],
                recentTrainers: [],
            };
        }
    }
};

export interface ServerStats {
    totalCaptures: number;
    totalShinies: number;
    totalBattles: number;
    activeTrainers: number;
    topShinies: LeaderboardEntry[];
    recentTrainers: LeaderboardEntry[];
}

export interface AcademyRankEntry {
    uuid: string;
    username: string;
    academyRank: number;
    academyScore: number;
    ranks: Record<string, number>;
    normalized: Record<string, number>;
    totalPlayers: number;
}


function stripPrefix(str: string): string {
    return str.replace("cobblemon:", "");
}

const NAME_EXCEPTIONS: Record<string, string> = {
    "roaringmoon": "roaring-moon",
    "ironvaliant": "iron-valiant",
    "walkingwake": "walking-wake",
    "ironleaves": "iron-leaves",
    "greattusk": "great-tusk",
    "screamtail": "scream-tail",
    "brutebonnet": "brute-bonnet",
    "fluttermane": "flutter-mane",
    "slitherwing": "slither-wing",
    "sandyshocks": "sandy-shocks",
    "irontreads": "iron-treads",
    "ironbundle": "iron-bundle",
    "ironhands": "iron-hands",
    "ironjugulis": "iron-jugulis",
    "ironmoth": "iron-moth",
    "ironthorns": "iron-thorns",
    "wochien": "wo-chien",
    "chienpao": "chien-pao",
    "tinglu": "ting-lu",
    "chiyu": "chi-yu",
    "tapukoko": "tapu-koko",
    "tapulele": "tapu-lele",
    "tapubulu": "tapu-bulu",
    "tapufini": "tapu-fini",
    "typenull": "type-null",
    "mrrime": "mr-rime",
    "mrmime": "mr-mime",
};

function transformBackendPokemon(p: BackendPokemon): Pokemon {
    const rawSpecies = stripPrefix(p.Species);
    const displaySpecies = rawSpecies.charAt(0).toUpperCase() + rawSpecies.slice(1);
    const exactSpecies = stripPrefix(p.Species).toLowerCase();

    const dbName = NAME_EXCEPTIONS[exactSpecies] || exactSpecies.replace(/[_ ]/g, "-");

    const spriteUrl = `https://img.pokemondb.net/sprites/home/${p.Shiny ? "shiny" : "normal"}/${dbName}.png`;

    return {
        species: displaySpecies,
        level: p.Level,
        shiny: p.Shiny,
        types: [],
        sprite: spriteUrl,
        ability: p.Ability?.AbilityName ? stripPrefix(p.Ability.AbilityName) : "Unknown",
        nature: stripPrefix(p.Nature),
        ivs: p.IVs,
    };
}
