import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LayoutDashboard, Trophy, Users, Menu } from "lucide-react";
import { useState } from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

const navItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Leaderboards",
        href: "/leaderboards",
        icon: Trophy,
    },
    {
        title: "Players",
        href: "/players",
        icon: Users,
    },
];

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("pb-12 h-screen border-r bg-sidebar hidden lg:block", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-primary">
                        Academy
                    </h2>
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                                            : "text-muted-foreground"
                                    )
                                }
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="lg:hidden px-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 bg-sidebar text-sidebar-foreground">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Mobile navigation sidebar</SheetDescription>
                <div className="px-2 py-4">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-primary">
                        Academy
                    </h2>
                    <div className="space-y-1 mt-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.href}
                                to={item.href}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center rounded-md px-4 py-3 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                                        isActive
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                            : "text-muted-foreground"
                                    )
                                }
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.title}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
