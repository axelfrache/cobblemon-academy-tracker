import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { api, type LeaderboardEntry } from "../api";
import { Swords, Sparkles, Search, ArrowRight, BookOpen, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Highlight {
    category: string;
    player: LeaderboardEntry | null;
    icon: LucideIcon;
    color: string;
}

export default function Dashboard() {
    const [highlights, setHighlights] = useState<Highlight[]>([
        { category: "Professor", player: null, icon: BookOpen, color: "text-pink-500" },
        { category: "League Champion", player: null, icon: Swords, color: "text-red-500" },
        { category: "Masuda Master", player: null, icon: Sparkles, color: "text-amber-500" },
    ]);

    const [recentSearches, setRecentSearches] = useState<{ name: string, uuid: string, date: number }[]>([]);

    useEffect(() => {
        const fetchHighlights = async () => {
            const [pokedex, battles, shiny] = await Promise.all([
                api.getLeaderboard("pokedex"),
                api.getLeaderboard("battles"),
                api.getLeaderboard("shiny")
            ]);

            setHighlights([
                { category: "Professor", player: pokedex[0], icon: BookOpen, color: "text-pink-500" },
                { category: "League Champion", player: battles[0], icon: Swords, color: "text-red-500" },
                { category: "Masuda Master", player: shiny[0], icon: Sparkles, color: "text-amber-500" },
            ]);
        };

        fetchHighlights();

        const storedRecents = localStorage.getItem("recent_searches");
        if (storedRecents) {
            setRecentSearches(JSON.parse(storedRecents).slice(0, 5));
        }
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary">Academy Dashboard</h1>
                <p className="text-muted-foreground">Overview of the current competitive landscape.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {highlights.map((item, i) => (
                    <Card key={i} className="relative overflow-hidden border-t-4 border-t-primary/20 hover:border-t-primary transition-all duration-300 hover:shadow-lg group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {item.category}
                            </CardTitle>
                            <item.icon className={cn("h-4 w-4", item.color)} />
                        </CardHeader>
                        <CardContent>
                            {item.player && item.player.name ? (
                                <div className="flex items-center gap-4 mt-2">
                                    <Link to={`/players/${item.player.uuid}`} className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/20 group-hover:ring-primary transition-all">
                                            <AvatarImage src={`https://minotar.net/avatar/${item.player.name}`} />
                                            <AvatarFallback>{item.player.name?.[0] ?? "?"}</AvatarFallback>
                                        </Avatar>
                                        <Badge className="absolute -bottom-2 -right-2 px-1.5 py-0 text-[10px] bg-primary text-primary-foreground">#1</Badge>
                                    </Link>
                                    <div>
                                        <Link to={`/players/${item.player.uuid}`} className="text-lg font-bold hover:underline">
                                            {item.player.name ?? "Unknown Trainer"}
                                        </Link>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {item.player.value} {item.category.includes("Professor") ? "species" : item.category.includes("Masuda") ? "shinies" : item.category.includes("Champion") ? "wins" : "caught"}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                        <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Recently Viewed</h2>
                    <Link to="/players" className="text-sm text-primary hover:underline flex items-center">
                        Search more <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </div>

                {recentSearches.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {recentSearches.map((search) => (
                            <Link key={search.uuid} to={`/players/${search.uuid}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Search className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{search.name}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No recent searches found. Start exploring via the search bar!
                    </div>
                )}
            </div>
        </div>
    );
}
