import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { api, type ServerStats } from "../api";
import {
    Swords,
    Sparkles,
    Search,
    ArrowRight,
    Users,
    Trophy,
    Activity,
    type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn, getAvatarUrl } from "@/lib/utils";

export default function Dashboard() {
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentSearches, setRecentSearches] = useState<{ name: string, uuid: string, date: number }[]>([]);

    const serverIp = import.meta.env.VITE_MINECRAFT_SERVER_IP;
    const [serverStatus, setServerStatus] = useState<{ online: boolean, players: { online: number, max: number }, motd?: { html: string[] } } | null>(null);

    useEffect(() => {
        if (serverIp) {
            fetch(`https://api.mcsrvstat.us/3/${serverIp}`)
                .then(res => res.json())
                .then(data => setServerStatus(data))
                .catch(err => console.error("Failed to fetch server status", err));
        }
    }, [serverIp]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await api.getServerStats();
            setStats(data);
            setLoading(false);
        };
        fetchData();

        const storedRecents = localStorage.getItem("recent_searches");
        if (storedRecents) {
            setRecentSearches(JSON.parse(storedRecents).slice(0, 5));
        }
    }, []);

    const StatsCard = ({ title, value, icon: Icon, subtext, color }: { title: string, value: string | number | React.ReactNode, icon: LucideIcon, subtext?: string, color?: string }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <Activity className="h-8 w-8" />
                    Server Overview
                </h1>
                <p className="text-muted-foreground">Real-time academy health and competitive status.</p>
            </div>

            {/* Top KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {serverIp ? (
                    /* Live Server Status Card */
                    <StatsCard
                        title="Server Status"
                        value={
                            serverStatus ? (
                                <div className="flex items-center gap-2">
                                    <span className={cn("relative flex h-3 w-3")}>
                                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", serverStatus.online ? "bg-green-400" : "bg-red-400")}></span>
                                        <span className={cn("relative inline-flex rounded-full h-3 w-3", serverStatus.online ? "bg-green-500" : "bg-red-500")}></span>
                                    </span>
                                    <span>{serverStatus.players.online}</span>
                                    <span className="text-muted-foreground text-lg font-medium">/ {serverStatus.players.max}</span>
                                </div>
                            ) : (
                                "Connecting..."
                            )
                        }
                        icon={Activity}
                        subtext={serverStatus?.online ? "Players Online" : "Server Offline"}
                        color={serverStatus?.online ? "text-green-500" : "text-red-500"}
                    />
                ) : (
                    /* Default: Active Trainers */
                    <StatsCard
                        title="Active Trainers"
                        value={stats?.activeTrainers ?? 0}
                        icon={Users}
                        subtext="Registered across leaderboards"
                        color="text-blue-500"
                    />
                )}

                <StatsCard
                    title="Total Captures"
                    value={stats?.totalCaptures.toLocaleString() ?? 0}
                    icon={Trophy}
                    subtext="Pokémon caught globally"
                    color="text-green-500"
                />
                <StatsCard
                    title="Total Shinies"
                    value={stats?.totalShinies.toLocaleString() ?? 0}
                    icon={Sparkles}
                    subtext="Shiny variants discovered"
                    color="text-amber-500"
                />
                <StatsCard
                    title="Battles Played"
                    value={stats?.totalBattles.toLocaleString() ?? 0}
                    icon={Swords}
                    subtext="Competitive matches"
                    color="text-red-500"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Shiny Overview Highlight */}
                <Card className="col-span-4 bg-gradient-to-br from-amber-500/5 to-background border-amber-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-500">
                            <Sparkles className="h-5 w-5 fill-amber-500/20" />
                            Shiny Discovery Feed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {stats?.topShinies.slice(0, 4).map((trainer, i) => (
                                        <div key={trainer.uuid} className="flex items-center gap-4 group">
                                            <Link to={`/players/${trainer.uuid}`}>
                                                <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-amber-500/20 group-hover:ring-amber-500 transition-all">
                                                    <AvatarImage src={getAvatarUrl(trainer.name)} />
                                                    <AvatarFallback>{trainer.name[0]}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div className="space-y-1">
                                                <Link to={`/players/${trainer.uuid}`} className="font-semibold hover:underline flex items-center gap-2">
                                                    {trainer.name}
                                                    {i === 0 && <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">#1 Hunter</Badge>}
                                                </Link>
                                                <p className="text-sm text-muted-foreground">
                                                    <span className="text-amber-500 font-medium">{trainer.value}</span> shinies found
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-amber-500/10">
                                    <div className="text-sm text-muted-foreground">
                                        Server shiny rate: <span className="font-mono text-foreground">
                                            {stats?.totalShinies && stats.totalShinies > 0
                                                ? `1 in ${Math.round((stats.totalCaptures || 0) / stats.totalShinies)}`
                                                : "No data yet"}
                                        </span>
                                    </div>
                                    <Link to="/leaderboards?tab=shiny" className="text-sm text-amber-500 hover:underline flex items-center">
                                        View full leaderboard <ArrowRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* New / Featured Trainers */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Featured Trainers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats?.recentTrainers.slice(0, 5).map((trainer) => (
                                    <Link key={trainer.uuid} to={`/players/${trainer.uuid}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={getAvatarUrl(trainer.name)} />
                                                <AvatarFallback>{trainer.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{trainer.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Rank #{trainer.rank}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recently Viewed */}
            {recentSearches.length > 0 && (
                <div className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Recently Scouted</h2>
                        <Link to="/players" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center">
                            Search database <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {recentSearches.map((search) => (
                            <Link key={search.uuid} to={`/players/${search.uuid}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed hover:border-solid">
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <Search className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm">{search.name}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
