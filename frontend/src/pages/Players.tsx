import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, History, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { getPrimaryTitle, type PlayerTitleData, RARITY_CONFIG, TONE_COLORS } from "@/lib/titles";
import { cn } from "@/lib/utils";

interface SuggestedPlayer {
    uuid: string;
    name: string;
    title: ReturnType<typeof getPrimaryTitle>;
}

export default function Players() {
    const [query, setQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState<{ name: string, uuid: string }[]>([]);
    const [suggestedPlayers, setSuggestedPlayers] = useState<SuggestedPlayer[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedRecents = localStorage.getItem("recent_searches");
        if (storedRecents) {
            setRecentSearches(JSON.parse(storedRecents));
        }

        const fetchSuggested = async () => {
            const [shiny, captures, battles] = await Promise.all([
                api.getLeaderboard("shiny"),
                api.getLeaderboard("captures"),
                api.getLeaderboard("battles"),
            ]);

            const playerStats = new Map<string, PlayerTitleData & { name: string }>();

            const mergeStats = (list: typeof shiny, key: keyof PlayerTitleData) => {
                list.forEach(entry => {
                    const current = playerStats.get(entry.uuid) || {
                        totalCaptures: 0,
                        shinyCount: 0,
                        battlesWon: 0,
                        pokedexCompletion: 0,
                        name: entry.name
                    };
                    current[key] = entry.value;
                    playerStats.set(entry.uuid, current);
                });
            };

            mergeStats(shiny, "shinyCount");
            mergeStats(captures, "totalCaptures");
            mergeStats(battles, "battlesWon");

            const suggestions: SuggestedPlayer[] = Array.from(playerStats.entries())
                .map(([uuid, stats]) => ({
                    uuid,
                    name: stats.name,
                    title: getPrimaryTitle(stats)
                }))
                .sort((a, b) => (b.title.priority + (b.title.rarity === 'Legendary' ? 1000 : b.title.rarity === 'Epic' ? 500 : 0)) -
                    (a.title.priority + (a.title.rarity === 'Legendary' ? 1000 : a.title.rarity === 'Epic' ? 500 : 0)))
                .slice(0, 12);

            setSuggestedPlayers(suggestions);
        };
        fetchSuggested();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && filteredSuggestions.length > 0) {
            navigate(`/players/${filteredSuggestions[0].uuid}`);
        }
    }

    const filteredSuggestions = suggestedPlayers.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <Users className="h-8 w-8" />
                    Player Directory
                </h1>
                <p className="text-muted-foreground">Find and inspect trainer profiles.</p>
            </div>

            <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Username or UUID..."
                                className="pl-10 h-10 w-full bg-background"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {recentSearches.length > 0 && !query && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Recently Viewed
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {recentSearches.map((p) => (
                            <Link key={p.uuid} to={`/players/${p.uuid}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                    <CardHeader className="flex flex-row items-center gap-4 p-4">
                                        <Avatar>
                                            <AvatarImage src={`https://minotar.net/avatar/${p.name}`} />
                                            <AvatarFallback>{p.name?.[0] ?? "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-semibold">{p.name}</div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    {query ? "Search Results" : "Top Trainers"}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredSuggestions.map((player) => (
                        <Link key={player.uuid} to={`/players/${player.uuid}`}>
                            <Card className={cn(
                                "transition-all group border hover:shadow-md",
                                RARITY_CONFIG[player.title.rarity].border,
                                RARITY_CONFIG[player.title.rarity].bg
                            )}>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className={cn(
                                        "h-12 w-12 transition-all border-2",
                                        player.title.rarity === "Legendary" ? "border-amber-500 shadow-amber-500/20 shadow-lg" : "border-transparent"
                                    )}>
                                        <AvatarImage src={`https://minotar.net/avatar/${player.name}`} />
                                        <AvatarFallback>{player.name?.[0] ?? "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <div className="font-bold truncate group-hover:text-primary transition-colors">{player.name}</div>
                                        <div className={cn("text-xs flex items-center gap-1 font-medium", TONE_COLORS[player.title.tone])}>
                                            <player.title.icon className="h-3 w-3" />
                                            {player.title.name}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                    {filteredSuggestions.length === 0 && query && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No top players found matching "{query}".
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
