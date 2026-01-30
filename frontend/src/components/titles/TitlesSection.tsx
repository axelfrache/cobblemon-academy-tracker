import {
    TITLE_DEFINITIONS,
    type PlayerTitleData,
    getEarnedTitles,
} from "@/lib/titles";
import { TitleCard } from "./TitleCard";
import { Award } from "lucide-react";

interface TitlesSectionProps {
    playerData: PlayerTitleData;
}

export function TitlesSection({ playerData }: TitlesSectionProps) {
    const earnedTitles = getEarnedTitles(playerData);
    const earnedIds = new Set(earnedTitles.map((t) => t.id));

    // Sort: earned first, then by rarity
    const sortedTitles = [...TITLE_DEFINITIONS].sort((a, b) => {
        const aEarned = earnedIds.has(a.id) ? 1 : 0;
        const bEarned = earnedIds.has(b.id) ? 1 : 0;
        if (aEarned !== bEarned) return bEarned - aEarned;

        const rarityOrder = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity] || b.priority - a.priority;
    });

    const earnedCount = earnedTitles.filter((t) => t.id !== "rookie-trainer").length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Trainer Titles</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                    {earnedCount} / {TITLE_DEFINITIONS.length - 1} earned
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTitles.map((title) => (
                    <TitleCard
                        key={title.id}
                        title={title}
                        playerData={playerData}
                    />
                ))}
            </div>
        </div>
    );
}
