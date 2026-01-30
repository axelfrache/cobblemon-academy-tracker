import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Users,
    Trophy,
    Sparkles,
    Swords,
    BookOpen,
    Egg,
    User,
    Loader2,
    GraduationCap,
} from "lucide-react";
import { api, type LeaderboardEntry } from "@/api";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [playerResults, setPlayerResults] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounced player search
    useEffect(() => {
        if (!query || query.length < 2) {
            setPlayerResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                // Search through captures leaderboard for players
                const results = await api.getLeaderboard("captures");
                const filtered = results.filter(
                    (p) =>
                        p.name.toLowerCase().includes(query.toLowerCase()) ||
                        p.uuid.toLowerCase().includes(query.toLowerCase())
                );
                setPlayerResults(filtered.slice(0, 5));
            } catch {
                setPlayerResults([]);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const runCommand = useCallback(
        (command: () => void) => {
            onOpenChange(false);
            command();
        },
        [onOpenChange]
    );

    const handleSelect = useCallback(
        (path: string) => {
            runCommand(() => navigate(path));
        },
        [navigate, runCommand]
    );

    // Reset query when dialog closes
    useEffect(() => {
        if (!open) {
            setQuery("");
            setPlayerResults([]);
        }
    }, [open]);

    const quickPages = [
        { name: "Dashboard", path: "/", icon: LayoutDashboard },
        { name: "Players", path: "/players", icon: Users },
        { name: "Leaderboards", path: "/leaderboards", icon: Trophy },
    ];

    const leaderboards = [
        { name: "Academy Rank", path: "/leaderboards?tab=academy", icon: GraduationCap, color: "text-indigo-500" },
        { name: "Pokédex Masters", path: "/leaderboards?tab=pokedex", icon: BookOpen, color: "text-pink-500" },
        { name: "Battle Wins", path: "/leaderboards?tab=battles", icon: Swords, color: "text-red-500" },
        { name: "Shiny Hunters", path: "/leaderboards?tab=shiny", icon: Sparkles, color: "text-amber-500" },
        { name: "Total Captures", path: "/leaderboards?tab=captures", icon: Trophy, color: "text-cyan-500" },
        { name: "Eggs Hatched", path: "/leaderboards?tab=breeders", icon: Egg, color: "text-green-500" },
    ];

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Command Palette"
            description="Search players, navigate pages, and more"
            showCloseButton={false}
            className="max-w-[560px]"
        >
            <CommandInput
                placeholder="Search players, pages, leaderboards..."
                value={query}
                onValueChange={setQuery}
            />
            <CommandList>
                <CommandEmpty>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Searching...</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">
                            No results found. Try a different search.
                        </span>
                    )}
                </CommandEmpty>

                {/* Player Results */}
                {playerResults.length > 0 && (
                    <CommandGroup heading="Players">
                        {playerResults.map((player) => (
                            <CommandItem
                                key={player.uuid}
                                value={`player-${player.name}-${player.uuid}`}
                                onSelect={() => handleSelect(`/players/${player.uuid}`)}
                                className="gap-3"
                            >
                                <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="h-6 w-6 rounded"
                                />
                                <span>{player.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground font-mono">
                                    {player.uuid.slice(0, 8)}...
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {/* Quick Navigation */}
                {!query && (
                    <>
                        <CommandGroup heading="Quick Navigation">
                            {quickPages.map((page) => (
                                <CommandItem
                                    key={page.path}
                                    value={page.name}
                                    onSelect={() => handleSelect(page.path)}
                                >
                                    <page.icon className="h-4 w-4 mr-2" />
                                    {page.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Leaderboards">
                            {leaderboards.map((lb) => (
                                <CommandItem
                                    key={lb.path}
                                    value={`leaderboard-${lb.name}`}
                                    onSelect={() => handleSelect(lb.path)}
                                >
                                    <lb.icon className={`h-4 w-4 mr-2 ${lb.color}`} />
                                    {lb.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Leaderboard suggestions when searching */}
                {query && (
                    <CommandGroup heading="Leaderboards">
                        {leaderboards
                            .filter((lb) =>
                                lb.name.toLowerCase().includes(query.toLowerCase())
                            )
                            .map((lb) => (
                                <CommandItem
                                    key={lb.path}
                                    value={`leaderboard-${lb.name}`}
                                    onSelect={() => handleSelect(lb.path)}
                                >
                                    <lb.icon className={`h-4 w-4 mr-2 ${lb.color}`} />
                                    {lb.name}
                                </CommandItem>
                            ))}
                    </CommandGroup>
                )}
            </CommandList>

            {/* Footer */}
            <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <kbd className="pointer-events-none h-5 px-1.5 rounded border bg-muted font-mono text-[10px]">↵</kbd>
                        <span>to open</span>
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="pointer-events-none h-5 px-1.5 rounded border bg-muted font-mono text-[10px]">esc</kbd>
                        <span>to close</span>
                    </span>
                </div>
                <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{playerResults.length} players found</span>
                </span>
            </div>
        </CommandDialog>
    );
}
