import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api, type LeaderboardEntry } from "../api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Sparkles, Swords, Trophy, Egg, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useSearchParams } from "react-router-dom";

const categories = {
    pokedex: { label: "Pokédex Masters", icon: BookOpen, color: "text-pink-500", bg: "bg-pink-500" },
    battles: { label: "Battle Wins", icon: Swords, color: "text-red-500", bg: "bg-red-500" },
    shiny: { label: "Shiny Dex", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500" },
    captures: { label: "Total Captures", icon: Trophy, color: "text-cyan-500", bg: "bg-cyan-500" },
    breeders: { label: "Eggs Hatched", icon: Egg, color: "text-green-500", bg: "bg-green-500" },
};

type CategoryKey = keyof typeof categories;

export default function Leaderboards() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab") as CategoryKey | null;
    const initialCategory = tabParam && tabParam in categories ? tabParam : "pokedex";

    const [category, setCategory] = useState<CategoryKey>(initialCategory);
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tabParam && tabParam in categories && tabParam !== category) {
            setCategory(tabParam);
        }
    }, [tabParam, category]);

    const handleCategoryChange = (value: string) => {
        const newCategory = value as CategoryKey;
        setCategory(newCategory);
        setSearchParams({ tab: newCategory });
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await api.getLeaderboard(category);
            setData(res);
            setLoading(false);
        };
        fetchData();
    }, [category]);

    const top3 = data.slice(0, 3);
    const rest = data.slice(3, 10);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <Trophy className="h-8 w-8" />
                    Leaderboards
                </h1>
                <p className="text-muted-foreground">The most elite trainers in the academy.</p>
            </div>

            <Tabs value={category} onValueChange={handleCategoryChange} className="space-y-8">
                <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-muted/50 p-1">
                    {Object.entries(categories).map(([key, { label, icon: Icon }]) => (
                        <TabsTrigger key={key} value={key} className="gap-1 sm:gap-2 px-2 sm:px-4 text-xs sm:text-sm">
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {loading ? (
                    <div className="space-y-8">
                        <div className="h-64 rounded-xl bg-muted/20 animate-pulse flex items-end justify-center gap-4 pb-8">
                            <div className="h-32 w-24 bg-muted rounded-t-lg" />
                            <div className="h-48 w-24 bg-muted rounded-t-lg" />
                            <div className="h-24 w-24 bg-muted rounded-t-lg" />
                        </div>
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <TabsContent value={category} className="space-y-8 mt-12">
                        {top3.length > 0 && (
                            <div className="relative flex items-end justify-center gap-4 sm:gap-8 h-80 pt-10 text-center">
                                {top3[1] && (
                                    <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
                                        <PodiumAvatar entry={top3[1]} rank={2} color="text-slate-400" ring="ring-slate-400" />
                                        <div className="h-32 w-20 sm:w-32 bg-slate-400/10 rounded-t-lg border-t border-slate-400/30 flex items-center justify-center relative">
                                            <span className="text-4xl font-black text-slate-400/20 absolute -bottom-4">2</span>
                                        </div>
                                    </div>
                                )}

                                {top3[0] && (
                                    <div className="flex flex-col items-center gap-2 z-10 -mt-8">
                                        <div className="absolute -top-12">
                                            <Crown className="h-8 w-8 text-primary animate-bounce fill-primary/20" />
                                        </div>
                                        <PodiumAvatar entry={top3[0]} rank={1} color="text-yellow-500" ring="ring-yellow-500" size="large" />
                                        <div className="h-48 w-24 sm:w-40 bg-yellow-500/10 rounded-t-lg border-t border-yellow-500/30 flex items-center justify-center relative shadow-[0_0_30px_-10px_rgba(234,179,8,0.4)]">
                                            <span className="text-6xl font-black text-yellow-500/20 absolute -bottom-4">1</span>
                                        </div>
                                    </div>
                                )}

                                {top3[2] && (
                                    <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
                                        <PodiumAvatar entry={top3[2]} rank={3} color="text-amber-700" ring="ring-amber-700" />
                                        <div className="h-24 w-20 sm:w-32 bg-amber-700/10 rounded-t-lg border-t border-amber-700/30 flex items-center justify-center relative">
                                            <span className="text-4xl font-black text-amber-700/20 absolute -bottom-4">3</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {rest.length > 0 && (
                            <div className="rounded-md border animate-in fade-in duration-700 delay-300">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>Trainer</TableHead>
                                            <TableHead className="text-right">Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rest.map((entry, index) => (
                                            <TableRow key={entry.uuid} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="text-center font-medium text-muted-foreground w-12">
                                                    {index + 4}
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/players/${entry.uuid}`} className="flex items-center gap-3 hover:underline group">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={`https://minotar.net/avatar/${entry.name}`} />
                                                            <AvatarFallback>{entry.name?.[0] ?? "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-semibold group-hover:text-primary transition-colors">{entry.name}</span>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium">
                                                    {entry.value.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {data.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No data available for this category yet.
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>

        </div>
    );
}

function PodiumAvatar({ entry, color, ring, size = "normal" }: { entry: LeaderboardEntry, rank: number, color: string, ring: string, size?: "normal" | "large" }) {
    const isLarge = size === "large";
    return (
        <div className="flex flex-col items-center gap-1">
            <Link to={`/players/${entry.uuid}`} className="relative group">
                <Avatar className={cn(
                    "border-4 border-background transition-transform group-hover:scale-105",
                    ring,
                    isLarge ? "h-24 w-24" : "h-16 w-16"
                )}>
                    <AvatarImage src={`https://minotar.net/avatar/${entry.name}`} />
                    <AvatarFallback>{entry.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className={cn(
                    "absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold bg-background shadow-sm border",
                    color,
                    isLarge ? "text-sm px-3" : ""
                )}>
                    {entry.name}
                </div>
            </Link>
            <div className={cn("font-mono font-bold mt-2", color, isLarge ? "text-xl" : "text-sm")}>
                {entry.value.toLocaleString()}
            </div>
        </div>
    );
}
