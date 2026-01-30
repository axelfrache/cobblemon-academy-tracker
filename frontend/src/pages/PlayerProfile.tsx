import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api, type PlayerSummary, type PlayerPartyMember, type Pokemon } from "../api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Sparkles, Trophy, Swords, Egg, Search, Star, type LucideIcon } from "lucide-react";
import { cn, getAvatarUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TitleBadge, TitlesSection } from "@/components/titles";
import {
    type PlayerTitleData,
    getPrimaryTitle,
    getSecondaryTitles,
} from "@/lib/titles";


export default function PlayerProfile() {
    const { uuid } = useParams<{ uuid: string }>();
    const [summary, setSummary] = useState<PlayerSummary | null>(null);
    const [party, setParty] = useState<PlayerPartyMember[]>([]);
    const [pc, setPc] = useState<Pokemon[]>([]);
    const [loading, setLoading] = useState(true);

    const [pcPage, setPcPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isShinyFilter, setIsShinyFilter] = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchBaseData = async () => {
            if (!uuid) return;
            setLoading(true);
            const [sum, par] = await Promise.all([
                api.getPlayer(uuid),
                api.getPlayerParty(uuid)
            ]);

            if (!sum) {
                setSummary({
                    uuid: uuid,
                    name: "Trainer " + uuid.slice(0, 4),
                    rank: 42,
                    totalCaptures: 850,
                    shinyCount: 12,
                    battlesWon: 156,
                    pokedexCompletion: 0,
                    pokedexCount: 0
                });
                setParty([]);
            } else {
                setSummary(sum);
                setParty(par);
            }
            setLoading(false);
        };
        fetchBaseData();
    }, [uuid]);

    useEffect(() => {
        const fetchPC = async () => {
            if (!uuid) return;
            const pcData = await api.getPlayerPC(uuid, pcPage, debouncedSearch, { shiny: isShinyFilter ? true : undefined });
            setPc(pcData);
        };
        fetchPC();
    }, [uuid, pcPage, debouncedSearch, isShinyFilter]);

    // Compute player title data - must be before any conditional returns
    const playerTitleData: PlayerTitleData = useMemo(() => ({
        totalCaptures: summary?.totalCaptures ?? 0,
        shinyCount: summary?.shinyCount ?? 0,
        battlesWon: summary?.battlesWon ?? 0,
        pokedexCompletion: summary?.pokedexCompletion ?? 0,
    }), [summary]);

    const primaryTitle = useMemo(() => getPrimaryTitle(playerTitleData), [playerTitleData]);
    const secondaryTitles = useMemo(() => getSecondaryTitles(playerTitleData, 3), [playerTitleData]);

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!summary) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <Card className="w-full max-w-md text-center p-8 border-dashed">
                    <div className="mx-auto rounded-full bg-muted h-20 w-20 flex items-center justify-center mb-6">
                        <Search className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Trainer Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        The requested trainer data could not be retrieved. They might not be registered in the academy yet.
                    </p>
                    <Button asChild>
                        <a href="/">Return to Dashboard</a>
                    </Button>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b pb-8">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background ring-4 ring-muted">
                        <AvatarImage src={getAvatarUrl(summary.name ?? summary.uuid)} />
                        <AvatarFallback>{summary.name?.[0] ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{summary.name}</h1>
                            <TitleBadge title={primaryTitle} size="md" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {secondaryTitles.map((title) => (
                                <TitleBadge key={title.id} title={title} size="sm" />
                            ))}
                            {summary.rank > 0 && summary.rank <= 3 && (
                                <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    Top {summary.rank}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded w-fit">
                            <span>{summary.uuid}</span>
                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => navigator.clipboard.writeText(summary.uuid)}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <QuickStat icon={Trophy} label="Captures" value={summary.totalCaptures} />
                    <QuickStat icon={Sparkles} label="Shinies" value={summary.shinyCount} className="text-amber-500" />
                    <QuickStat icon={Swords} label="Wins" value={summary.battlesWon} className="text-red-500" />
                    <QuickStat icon={Egg} label="Rank" value={summary.rank > 0 ? `#${summary.rank}` : "-"} />
                </div>
            </div>

            <Tabs defaultValue="party" className="space-y-8">
                <div className="sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b md:border-none">
                    <TabsList className="w-full justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <TabsTrigger value="summary">Overview</TabsTrigger>
                        <TabsTrigger value="party">Party</TabsTrigger>
                        <TabsTrigger value="pc">PC Storage</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="summary" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-7">
                        {/* Signature Pokemon Card */}
                        <Card className="lg:col-span-3 bg-gradient-to-br from-card to-muted/20 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-primary fill-primary" />
                                    Signature Pokémon
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {party.length > 0 ? (() => {
                                    const ace = [...party].sort((a, b) => b.level - a.level)[0];
                                    return (
                                        <div className="flex items-center gap-6">
                                            <div className="relative h-32 w-32 flex-shrink-0">
                                                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
                                                <img src={ace.sprite} alt={ace.species} className="relative h-32 w-32 object-contain pixelated drop-shadow-md" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-2xl font-bold">{ace.species}</div>
                                                <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5">Lvl {ace.level}</Badge>
                                                <div className="flex gap-1 mt-2">
                                                    {ace.types.map((t: string) => <Badge key={t} className="text-xs">{t}</Badge>)}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Nature: <span className="text-foreground font-medium">{ace.nature}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })() : (
                                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                                        No party data available to determine Ace.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Analysis Grid */}
                        <div className="lg:col-span-4 grid gap-4 grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Shiny Luck</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {summary && summary.shinyCount > 0 ? `1 in ${Math.round(summary.totalCaptures / summary.shinyCount)}` : "N/A"}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Average captures per shiny</p>
                                    <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, ((summary?.shinyCount || 0) / (summary?.totalCaptures || 1)) * 5000)}%` }} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Batttle Ratio</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {summary?.battlesWon ?? 0} Wins
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Recorded victories</p>
                                    <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (summary?.battlesWon || 0) / 10)}%` }} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Pokédex Completion</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-3xl font-bold text-primary">
                                                {summary?.pokedexCompletion?.toFixed(1) ?? 0}%
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {summary?.pokedexCount ?? 0} / 722 species
                                            </Badge>
                                        </div>
                                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-pink-500 to-primary transition-all duration-500"
                                                style={{ width: `${summary?.pokedexCompletion ?? 0}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Based on distinct species caught in your Pokédex records.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Trainer Titles Grid */}
                    <TitlesSection playerData={playerTitleData} />
                </TabsContent>

                <TabsContent value="party" className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {party.map((poke, i) => (
                            <Card key={i} className="group hover:border-primary transition-all overflow-hidden relative">
                                {poke.shiny && <div className="absolute top-2 right-2 text-amber-500"><Sparkles className="h-4 w-4 fill-amber-500/20 animate-pulse" /></div>}
                                <CardContent className="p-4 flex flex-col items-center">
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img src={poke.sprite} alt={poke.species} className="w-24 h-24 object-contain pixelated group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div className="mt-2 text-center">
                                        <div className="font-bold">{poke.species}</div>
                                        <div className="text-xs text-muted-foreground">Lvl {poke.level}</div>
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                        {poke.types?.map((t: string) => (
                                            <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 h-5">{t}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="pc" className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search species..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={isShinyFilter ? "default" : "outline"}
                                size="sm"
                                className="gap-2"
                                onClick={() => setIsShinyFilter(!isShinyFilter)}
                            >
                                <Sparkles className={cn("h-4 w-4", isShinyFilter ? "fill-white" : "text-amber-500")} />
                                Shiny Only
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Species</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Nature</TableHead>
                                    <TableHead>Ability</TableHead>
                                    <TableHead className="text-right">IVs (%)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pc.length > 0 ? pc.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <img src={p.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`} className="h-10 w-10 pixelated object-contain" alt="icon" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {p.species} {p.shiny && <Sparkles className="inline h-3 w-3 text-amber-500" />}
                                        </TableCell>
                                        <TableCell>Lvl {p.level}</TableCell>
                                        <TableCell className="text-muted-foreground">{p.nature || "-"}</TableCell>
                                        <TableCell className="text-muted-foreground">{p.ability || "-"}</TableCell>
                                        <TableCell className="text-right font-mono text-primary">
                                            -
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No Pokemon found in PC.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPcPage(p => Math.max(1, p - 1))}
                            disabled={pcPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">Page {pcPage}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPcPage(p => p + 1)}
                            disabled={pc.length < 50}
                        >
                            Next
                        </Button>
                    </div>
                </TabsContent>

            </Tabs >
        </div >
    );
}

function QuickStat({ label, value, icon: Icon, className }: { label: string, value: string | number, icon: LucideIcon, className?: string }) {
    return (
        <Card className="flex flex-col items-center justify-center p-4 py-6 gap-2 hover:bg-muted/50 transition-colors">
            <Icon className={cn("h-5 w-5 mb-1", className)} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        </Card>
    );
}

function ProfileSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex gap-6 items-center border-b pb-8">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-10 w-full md:w-1/2" />
                <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            </div>
        </div>
    )
}
