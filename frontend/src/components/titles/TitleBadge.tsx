import { cn } from "@/lib/utils";
import {
    type TitleDefinition,
    RARITY_CONFIG,
    TONE_COLORS,
} from "@/lib/titles";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TitleBadgeProps {
    title: TitleDefinition;
    earned?: boolean;
    size?: "sm" | "md";
    showLabel?: boolean;
    className?: string;
}

export function TitleBadge({
    title,
    earned = true,
    size = "sm",
    showLabel = true,
    className,
}: TitleBadgeProps) {
    const Icon = title.icon;
    const rarityStyle = RARITY_CONFIG[title.rarity];
    const toneColor = TONE_COLORS[title.tone];

    const sizeClasses = {
        sm: "h-6 px-2 text-xs gap-1",
        md: "h-8 px-3 text-sm gap-1.5",
    };

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "inline-flex items-center rounded-full border font-medium transition-all",
                            sizeClasses[size],
                            earned
                                ? [rarityStyle.border, rarityStyle.bg, rarityStyle.glow]
                                : "border-muted bg-muted/30 opacity-50",
                            className
                        )}
                    >
                        <Icon
                            className={cn(
                                iconSizes[size],
                                earned ? toneColor : "text-muted-foreground"
                            )}
                        />
                        {showLabel && (
                            <span
                                className={cn(
                                    earned ? toneColor : "text-muted-foreground"
                                )}
                            >
                                {title.name}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", toneColor)} />
                            {title.name}
                            <span className={cn("text-xs", rarityStyle.text)}>
                                ({title.rarity})
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {title.description}
                        </p>
                        <p className="text-xs font-medium text-foreground/80">
                            {title.displayRule}
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
