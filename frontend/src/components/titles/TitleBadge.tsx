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
    variant?: "major" | "secondary" | "default";
    className?: string;
    customLabel?: string;
}

export function TitleBadge({
    title,
    earned = true,
    variant = "default",
    className,
    customLabel,
}: TitleBadgeProps) {
    const Icon = title.icon;
    const rarityStyle = RARITY_CONFIG[title.rarity];
    const toneColor = TONE_COLORS[title.tone];

    // Style configurations based on variant
    const variantStyles = {
        major: {
            container: "h-9 px-4 text-sm gap-2 border-2 shadow-[0_0_15px_-3px_rgba(255,215,0,0.3)]",
            icon: "h-5 w-5",
            text: "font-bold tracking-tight",
        },
        secondary: {
            container: "h-7 px-2.5 text-xs gap-1.5 border hover:bg-muted/50 transition-colors",
            icon: "h-3.5 w-3.5",
            text: "font-medium text-muted-foreground group-hover:text-foreground transition-colors",
        },
        default: {
            container: "h-8 px-3 text-sm gap-1.5 border",
            icon: "h-4 w-4",
            text: "font-medium",
        },
    };

    const style = variantStyles[variant];

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "inline-flex items-center rounded-full transition-all cursor-default select-none group",
                            style.container,
                            earned
                                ? [
                                    variant === "major"
                                        ? [rarityStyle.border, rarityStyle.bg, rarityStyle.glow]
                                        : [rarityStyle.border, "bg-background/50 backdrop-blur-sm"],
                                ]
                                : "border-muted bg-muted/30 opacity-50",
                            className
                        )}
                    >
                        <Icon
                            className={cn(
                                style.icon,
                                earned ? toneColor : "text-muted-foreground"
                            )}
                        />
                        <span
                            className={cn(
                                style.text,
                                earned && variant === "major" ? toneColor : ""
                            )}
                        >
                            {customLabel || title.name}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2">
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
