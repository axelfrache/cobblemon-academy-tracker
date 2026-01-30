import { cn } from "@/lib/utils";
import {
    type TitleDefinition,
    type PlayerTitleData,
    RARITY_CONFIG,
    TONE_COLORS,
} from "@/lib/titles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Check, Lock, Loader2 } from "lucide-react";
import { useState } from "react";

interface TitleCardProps {
    title: TitleDefinition;
    playerData: PlayerTitleData;
    className?: string;
}

export function TitleCard({ title, playerData, className }: TitleCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const Icon = title.icon;
    const rarityStyle = RARITY_CONFIG[title.rarity];
    const toneColor = TONE_COLORS[title.tone];

    const isEarned = title.compute(playerData);
    const progress = title.progress(playerData);
    const isInProgress = !isEarned && progress.pct > 0;

    const statusIcon = isEarned ? (
        <Check className="h-4 w-4 text-green-500" />
    ) : isInProgress ? (
        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
    ) : (
        <Lock className="h-4 w-4 text-muted-foreground" />
    );

    const statusText = isEarned ? "Earned" : isInProgress ? "In Progress" : "Locked";

    // Calculate improvement hint
    const remaining = progress.target - progress.current;
    const getHint = () => {
        if (isEarned) return null;
        if (title.id.includes("shiny")) return `Catch ${remaining} more shiny Pokémon`;
        if (title.id.includes("pokedex") || title.id.includes("professor")) return `Discover ${remaining}% more species`;
        if (title.id.includes("battle") || title.id.includes("champion")) return `Win ${remaining} more battles`;
        if (title.id.includes("collector") || title.id.includes("capture")) return `Capture ${remaining} more Pokémon`;
        return null;
    };

    const hint = getHint();

    return (
        <Card
            className={cn(
                "transition-all duration-200 hover:shadow-md",
                isEarned && [rarityStyle.border, rarityStyle.glow],
                !isEarned && "opacity-80 border-muted",
                className
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                                "p-2 rounded-lg",
                                isEarned ? rarityStyle.bg : "bg-muted"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5",
                                    isEarned ? toneColor : "text-muted-foreground"
                                )}
                            />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold">
                                {title.name}
                            </CardTitle>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] mt-0.5",
                                    isEarned && rarityStyle.text
                                )}
                            >
                                {title.rarity}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        {statusIcon}
                        <span className={cn(
                            isEarned && "text-green-500",
                            isInProgress && "text-amber-500",
                            !isEarned && !isInProgress && "text-muted-foreground"
                        )}>
                            {statusText}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Progress bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress.current}</span>
                        <span>{progress.target}</span>
                    </div>
                    <Progress
                        value={progress.pct}
                        className={cn(
                            "h-2",
                            isEarned && "[&>div]:bg-green-500",
                            isInProgress && "[&>div]:bg-amber-500"
                        )}
                    />
                    <div className="text-xs text-right text-muted-foreground">
                        {Math.round(progress.pct)}%
                    </div>
                </div>

                {/* Improvement hint */}
                {hint && (
                    <p className="text-xs text-muted-foreground italic">
                        💡 {hint}
                    </p>
                )}

                {/* Collapsible rules */}
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-between py-1">
                        <span>View rules</span>
                        <ChevronDown
                            className={cn(
                                "h-3 w-3 transition-transform",
                                isOpen && "rotate-180"
                            )}
                        />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                        <div className="text-xs space-y-1 p-2 rounded bg-muted/50">
                            <p className="font-medium">{title.displayRule}</p>
                            <p className="text-muted-foreground">{title.description}</p>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
