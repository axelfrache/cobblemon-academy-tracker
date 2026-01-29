import { MobileSidebar } from "./Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { api, type LeaderboardEntry } from "../../lib/api";

export function Topbar() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<LeaderboardEntry[]>([]);
    const [allPlayers, setAllPlayers] = useState<LeaderboardEntry[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        const loadPlayers = async () => {
            const [shiny, captures] = await Promise.all([
                api.getLeaderboard("shiny"),
                api.getLeaderboard("captures")
            ]);
            const unique = Array.from(new Map([...shiny, ...captures].map(item => [item.uuid, item])).values());
            setAllPlayers(unique);
        };
        loadPlayers();
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        const lower = query.toLowerCase();
        const filtered = allPlayers.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.uuid.toLowerCase().includes(lower)
        ).slice(0, 5);
        setSuggestions(filtered);
    }, [query, allPlayers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (suggestions.length > 0) {
            navigate(`/players/${suggestions[0].uuid}`);
            setShowSuggestions(false);
            setQuery("");
        }
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 backdrop-blur-md bg-opacity-80">
            <MobileSidebar />
            <div className="w-full flex-1">
                <form onSubmit={handleSearch}>
                    <div className="relative md:w-2/3 lg:w-1/3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search player (UUID or name)..."
                            className="w-full appearance-none bg-background pl-8 shadow-none border-muted focus-visible:ring-primary"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        {showSuggestions && query && (
                            <div className="absolute top-full left-0 right-0 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {suggestions.length > 0 ? (
                                    <div className="py-1">
                                        {suggestions.map((p) => (
                                            <button
                                                key={p.uuid}
                                                type="button"
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-3 transition-colors"
                                                onClick={() => {
                                                    navigate(`/players/${p.uuid}`);
                                                    setQuery("");
                                                }}
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={`https://minotar.net/avatar/${p.name}`} />
                                                    <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                        No players found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>

            </div>
        </header>
    );
}
