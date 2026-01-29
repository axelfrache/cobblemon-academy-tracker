const BASE_URL = "http://localhost:8000";

// Types
export interface PlayerSummary {
    uuid: string;
    name: string;
    rank: number;
    totalCaptures: number;
    shinyCount: number;
    battlesWon: number;
}

export interface Pokemon {
    species: string;
    level: number;
    shiny: boolean;
    types: string[]; // Might need adjustment if backend doesn't return this yet
    sprite: string; // URL derived or returned
    ability?: string;
    nature?: string;
    ivs?: any; // Simplified for now
    boxIndex?: number;
    slotIndex?: number;
}

export type PlayerPartyMember = Pokemon;

export interface LeaderboardEntry {
    uuid: string;
    name: string;
    value: number;
    avatar: string;
    rank: number; // Add rank field
}

// Backend Types (Internal)
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

// API Client
export const api = {
    getLeaderboard: async (category: "shiny" | "captures" | "battles" | "breeders" | "aspects"): Promise<LeaderboardEntry[]> => {
        try {
            const res = await fetch(`${BASE_URL}/leaderboards/${category}`);
            if (!res.ok) throw new Error("Failed to fetch leaderboard");
            const data: BackendLeaderboardEntry[] = await res.json();

            // Transform to frontend format
            return data.map(entry => ({
                uuid: entry.uuid,
                name: entry.username || "Unknown",
                value: entry.value,
                avatar: `https://minotar.net/avatar/${entry.username || 'steve'}`, // Computed here just in case, though components use name
                rank: entry.rank
            }));
        } catch (error) {
            console.error(error);
            return []; // Fail gracefully
        }
    },

    getPlayerSummary: async (uuid: string): Promise<PlayerSummary | null> => {
        try {
            // Parallel fetch: Summary and Leaderboard (to get rank)
            // We assume "captures" is the main ranking for the profile badge
            const [summaryRes, leaderboard] = await Promise.all([
                fetch(`${BASE_URL}/players/${uuid}/summary`),
                api.getLeaderboard("captures")
            ]);

            if (!summaryRes.ok) return null;
            const data: BackendPlayerSummary = await summaryRes.json();

            // Find rank in leaderboard
            const rankEntry = leaderboard.find(e => e.uuid === uuid);
            const rank = rankEntry ? rankEntry.rank : 0;

            // Transform nested aggregation to flat summary
            return {
                uuid: data.uuid,
                name: data.username || "Unknown",
                rank: rank,
                totalCaptures: data.advancementData?.totalCaptureCount ?? 0,
                shinyCount: data.advancementData?.totalShinyCaptureCount ?? 0,
                battlesWon: data.advancementData?.totalBattleVictoryCount ?? 0,
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

            // Transform
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
    }
};

// Helper to strip "cobblemon:" prefix
function stripPrefix(str: string): string {
    return str.replace("cobblemon:", "");
}

// Helper to transform Pokemon data
function transformBackendPokemon(p: BackendPokemon): Pokemon {
    // Strip prefix from species
    const rawSpecies = stripPrefix(p.Species);

    // Formatting for display (Capitalize first letter)
    const displaySpecies = rawSpecies.charAt(0).toUpperCase() + rawSpecies.slice(1);

    // Formatting:
    // Showdown (Animated): "ironvaliant" (lowercase, no separators)
    // PokemonDB (Icon): "iron-valiant" (kebab-case)

    // Strip cobblemon: prefix if present (already done by stripPrefix, but specific to usage)
    const exactSpecies = stripPrefix(p.Species).toLowerCase();
    const showdownName = exactSpecies.replace(/[_ ]/g, "");
    // const iconName = exactSpecies.replace(/[_ ]/g, "-");

    // Animated GIF from Showdown
    const spriteUrl = `https://play.pokemonshowdown.com/sprites/${p.Shiny ? "xyani-shiny" : "xyani"}/${showdownName}.gif`;

    // Static Icon from PokemonDB
    // const iconUrl = `https://img.pokemondb.net/sprites/scarlet-violet/icon/${iconName}.png`;

    return {
        species: displaySpecies,
        level: p.Level,
        shiny: p.Shiny,
        types: [], // Backend doesn't provide types
        sprite: spriteUrl, // Now animated!
        ability: p.Ability?.AbilityName ? stripPrefix(p.Ability.AbilityName) : "Unknown",
        nature: stripPrefix(p.Nature),
        ivs: p.IVs, // Pass through
    };
}


