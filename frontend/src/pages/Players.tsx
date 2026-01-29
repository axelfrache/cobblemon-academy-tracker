import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, History, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type LeaderboardEntry } from "../lib/api_client";

export default function Players() {
    const [query, setQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState<{ name: string, uuid: string }[]>([]);
    const [suggestedPlayers, setSuggestedPlayers] = useState<LeaderboardEntry[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedRecents = localStorage.getItem("recent_searches");
        if (storedRecents) {
            setRecentSearches(JSON.parse(storedRecents));
        }

        const fetchSuggested = async () => {
            const [shiny, captures] = await Promise.all([
                api.getLeaderboard("shiny"),
                api.getLeaderboard("captures")
            ]);
            const combined = [...shiny, ...captures];
            const unique = Array.from(new Map(combined.map(item => [item.uuid, item])).values());
            setSuggestedPlayers(unique.slice(0, 12));
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
                <h1 className="text-3xl font-bold tracking-tight text-primary">Player Directory</h1>
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
                    {query ? "Search Results (from Top Players)" : "Top Trainers"}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredSuggestions.map((player) => (
                        <Link key={player.uuid} to={`/players/${player.uuid}`}>
                            <Card className="hover:border-primary transition-all group">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-12 w-12 group-hover:ring-2 ring-primary transition-all">
                                        <AvatarImage src={`https://minotar.net/avatar/${player.name}`} />
                                        <AvatarFallback>{player.name?.[0] ?? "?"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold group-hover:text-primary transition-colors">{player.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">Ranked Player</div>
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
