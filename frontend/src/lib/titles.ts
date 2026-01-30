import {
    Sparkles,
    BookOpen,
    Swords,
    Trophy,
    Crown,
    Star,
    Gem,
    type LucideIcon,
} from "lucide-react";

export type TitleRarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface PlayerTitleData {
    totalCaptures: number;
    shinyCount: number;
    battlesWon: number;
    pokedexCompletion: number; // percentage 0-100
}

export interface TitleProgress {
    current: number;
    target: number;
    pct: number;
}

export interface TitleDefinition {
    id: string;
    name: string;
    shortLabel: string;
    description: string;
    icon: LucideIcon;
    tone: "gold" | "blue" | "red" | "purple" | "green" | "amber" | "gray";
    rarity: TitleRarity;
    priority: number;
    displayRule: string;
    compute: (data: PlayerTitleData) => boolean;
    progress: (data: PlayerTitleData) => TitleProgress;
}

export const TITLE_DEFINITIONS: TitleDefinition[] = [
    // Legendary Titles
    {
        id: "pokedex-master",
        name: "Pokédex Master",
        shortLabel: "Master",
        description: "A true Pokémon scholar who has catalogued nearly all species.",
        icon: Crown,
        tone: "gold",
        rarity: "Legendary",
        priority: 100,
        displayRule: "Complete 80% or more of the Pokédex",
        compute: (data) => data.pokedexCompletion >= 80,
        progress: (data) => ({
            current: Math.round(data.pokedexCompletion),
            target: 80,
            pct: Math.min(100, (data.pokedexCompletion / 80) * 100),
        }),
    },
    {
        id: "masuda-master",
        name: "Masuda Master",
        shortLabel: "Masuda",
        description: "A legendary shiny hunter with an extraordinary collection.",
        icon: Gem,
        tone: "amber",
        rarity: "Legendary",
        priority: 90,
        displayRule: "Catch 50 or more shiny Pokémon",
        compute: (data) => data.shinyCount >= 50,
        progress: (data) => ({
            current: data.shinyCount,
            target: 50,
            pct: Math.min(100, (data.shinyCount / 50) * 100),
        }),
    },

    // Epic Titles
    {
        id: "league-champion",
        name: "League Champion",
        shortLabel: "Champion",
        description: "A formidable battler who dominates the competition.",
        icon: Swords,
        tone: "red",
        rarity: "Epic",
        priority: 80,
        displayRule: "Win 100 or more battles",
        compute: (data) => data.battlesWon >= 100,
        progress: (data) => ({
            current: data.battlesWon,
            target: 100,
            pct: Math.min(100, (data.battlesWon / 100) * 100),
        }),
    },
    {
        id: "elite-collector",
        name: "Elite Collector",
        shortLabel: "Elite",
        description: "An obsessive collector with over a thousand captures.",
        icon: Trophy,
        tone: "purple",
        rarity: "Epic",
        priority: 70,
        displayRule: "Capture 1000 or more Pokémon",
        compute: (data) => data.totalCaptures >= 1000,
        progress: (data) => ({
            current: data.totalCaptures,
            target: 1000,
            pct: Math.min(100, (data.totalCaptures / 1000) * 100),
        }),
    },

    // Rare Titles
    {
        id: "shiny-hunter",
        name: "Shiny Hunter",
        shortLabel: "Shiny",
        description: "A dedicated trainer who seeks rare shiny variants.",
        icon: Sparkles,
        tone: "amber",
        rarity: "Rare",
        priority: 60,
        displayRule: "Catch 10 or more shiny Pokémon",
        compute: (data) => data.shinyCount >= 10,
        progress: (data) => ({
            current: data.shinyCount,
            target: 10,
            pct: Math.min(100, (data.shinyCount / 10) * 100),
        }),
    },
    {
        id: "professor",
        name: "Professor",
        shortLabel: "Prof",
        description: "A studious trainer building a comprehensive Pokédex.",
        icon: BookOpen,
        tone: "blue",
        rarity: "Rare",
        priority: 55,
        displayRule: "Complete 50% or more of the Pokédex",
        compute: (data) => data.pokedexCompletion >= 50,
        progress: (data) => ({
            current: Math.round(data.pokedexCompletion),
            target: 50,
            pct: Math.min(100, (data.pokedexCompletion / 50) * 100),
        }),
    },
    {
        id: "battle-elite",
        name: "Battle Elite",
        shortLabel: "Elite",
        description: "A skilled battler with many victories under their belt.",
        icon: Swords,
        tone: "red",
        rarity: "Rare",
        priority: 50,
        displayRule: "Win 50 or more battles",
        compute: (data) => data.battlesWon >= 50,
        progress: (data) => ({
            current: data.battlesWon,
            target: 50,
            pct: Math.min(100, (data.battlesWon / 50) * 100),
        }),
    },
    {
        id: "collector",
        name: "Collector",
        shortLabel: "Collector",
        description: "A passionate trainer who loves catching Pokémon.",
        icon: Trophy,
        tone: "green",
        rarity: "Rare",
        priority: 40,
        displayRule: "Capture 500 or more Pokémon",
        compute: (data) => data.totalCaptures >= 500,
        progress: (data) => ({
            current: data.totalCaptures,
            target: 500,
            pct: Math.min(100, (data.totalCaptures / 500) * 100),
        }),
    },

    // Common Titles
    {
        id: "rookie-trainer",
        name: "Rookie Trainer",
        shortLabel: "Rookie",
        description: "Every master was once a beginner. Keep training!",
        icon: Star,
        tone: "gray",
        rarity: "Common",
        priority: 0,
        displayRule: "Default title for all trainers",
        compute: () => true, // Always earned
        progress: () => ({ current: 1, target: 1, pct: 100 }),
    },
];

// Rarity styling configuration
export const RARITY_CONFIG: Record<TitleRarity, { border: string; bg: string; text: string; glow: string }> = {
    Legendary: {
        border: "border-amber-500/50",
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        glow: "shadow-amber-500/20 shadow-lg",
    },
    Epic: {
        border: "border-purple-500/50",
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        glow: "",
    },
    Rare: {
        border: "border-blue-500/50",
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        glow: "",
    },
    Common: {
        border: "border-muted",
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        glow: "",
    },
};

// Tone colors for icons
export const TONE_COLORS: Record<TitleDefinition["tone"], string> = {
    gold: "text-amber-500",
    amber: "text-amber-400",
    blue: "text-blue-500",
    red: "text-red-500",
    purple: "text-purple-500",
    green: "text-green-500",
    gray: "text-muted-foreground",
};

// Helper functions
export function getEarnedTitles(data: PlayerTitleData): TitleDefinition[] {
    return TITLE_DEFINITIONS.filter((t) => t.compute(data));
}

export function getPrimaryTitle(data: PlayerTitleData): TitleDefinition {
    const earned = getEarnedTitles(data);
    if (earned.length === 0) {
        return TITLE_DEFINITIONS.find((t) => t.id === "rookie-trainer")!;
    }

    const rarityOrder: Record<TitleRarity, number> = {
        Legendary: 4,
        Epic: 3,
        Rare: 2,
        Common: 1,
    };

    return earned.sort(
        (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity] || b.priority - a.priority
    )[0];
}

export function getSecondaryTitles(data: PlayerTitleData, limit = 3): TitleDefinition[] {
    const primary = getPrimaryTitle(data);
    const earned = getEarnedTitles(data).filter((t) => t.id !== primary.id && t.id !== "rookie-trainer");

    const rarityOrder: Record<TitleRarity, number> = {
        Legendary: 4,
        Epic: 3,
        Rare: 2,
        Common: 1,
    };

    return earned
        .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity] || b.priority - a.priority)
        .slice(0, limit);
}
