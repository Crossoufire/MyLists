import React, {useState} from "react";
import {RoleType} from "@/lib/utils/enums";
import {cva} from "class-variance-authority";
import {capitalize} from "@/lib/utils/formating";
import authClient from "@/lib/utils/auth-client";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {useQueryClient} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {LoginForm} from "@/lib/client/components/auth/LoginForm";
import {SearchBar} from "@/lib/client/components/navbar/SearchBar";
import {Link, useNavigate, useRouter} from "@tanstack/react-router";
import {RegisterForm} from "@/lib/client/components/auth/RegisterForm";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {Notifications} from "@/lib/client/components/navbar/Notifications";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";
import {BarChart2, Calendar, ChartNoAxesColumn, ChevronDown, Crown, LogOut, Menu, Popcorn, Settings, ShieldCheck, Sparkles, TrendingUp, Trophy, User, X} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/lib/client/components/ui/dropdown-menu";


const navStyle = cva("inline-flex items-center justify-center px-4 text-sm font-medium hover:text-app-accent " +
    "disabled:pointer-events-none disabled:opacity-50"
)


export const Navbar = () => {
    const router = useRouter();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const logoutUser = async () => {
        await authClient.signOut();
        await router.invalidate();
        queryClient.setQueryData(authOptions.queryKey, null);
        await navigate({ to: "/", replace: true });
        queryClient.removeQueries();
    };

    // Login page and public pages when not logged
    if (!currentUser) {
        return (
            <nav className="sticky top-0 z-50 w-full bg-background border-b">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        <div className="flex shrink-0 items-center gap-2">
                            <img
                                alt="MyLists logo"
                                className="size-5"
                                src="/logo192.png"
                            />
                            <span className="text-xl font-bold text-primary block tracking-tight max-sm:hidden">
                                MyLists
                            </span>
                        </div>
                        <div className="space-x-3">
                            <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)}>
                                Login
                            </Button>
                            <Button size="sm" onClick={() => setShowRegister(true)}>
                                Register
                            </Button>
                        </div>
                        <LoginForm
                            open={showLogin}
                            onOpenChange={setShowLogin}
                        />
                        <RegisterForm
                            open={showRegister}
                            onOpenChange={setShowRegister}
                        />
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-background border-b">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16 gap-4">

                    <div className="flex shrink-0 items-center gap-2">
                        <img
                            alt="MyLists logo"
                            className="size-5"
                            src="/logo192.png"
                        />
                        <span className="text-xl font-bold text-primary block tracking-tight max-sm:hidden">
                            MyLists
                        </span>
                    </div>

                    <div className="flex-1 max-w-md z-50 block max-lg:hidden">
                        <SearchBar/>
                    </div>

                    <div className="flex items-center gap-1 max-lg:hidden">
                        <Link to="/hall-of-fame" className={navStyle()} activeProps={{ className: "text-app-accent font-bold" }}>
                            HoF
                        </Link>
                        <Link to="/platform-stats" className={navStyle()} activeProps={{ className: "text-app-accent font-bold" }}>
                            Stats
                        </Link>
                        <Link to="/trends" className={navStyle()} activeProps={{ className: "text-app-accent font-bold" }}>
                            Trends
                        </Link>
                        <Link to="/moviedle" className={navStyle()} activeProps={{ className: "text-app-accent font-bold" }}>
                            Moviedle
                        </Link>
                    </div>

                    <div className="flex items-center gap-1 max-sm:gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger className={navStyle()}>
                                MyMedia
                                <ChevronDown className="ml-2 size-3 opacity-70"/>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-42" align="end">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Tracking Lists
                                </DropdownMenuLabel>
                                <DropdownMenuGroup className="space-y-1">
                                    {currentUser?.settings.filter((s) => s.active).map((setting) =>
                                        <DropdownMenuItem key={setting.mediaType} asChild>
                                            <Link
                                                to="/list/$mediaType/$username"
                                                params={{ mediaType: setting.mediaType, username: currentUser.name }}
                                            >
                                                <MainThemeIcon type={setting.mediaType}/>
                                                {capitalize(setting.mediaType)} List
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator/>
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link to="/coming-next">
                                            <Calendar/>
                                            Coming Next
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Notifications/>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="relative">
                                    <Button
                                        variant="invisible"
                                        className="flex items-center gap-2 text-lg font-semibold px-1"
                                    >
                                        <ProfileIcon
                                            fallbackSize="text-base"
                                            user={{ name: currentUser.name, image: currentUser.image! }}
                                            className="size-10 border-none hover:ring-2 hover:ring-app-accent"
                                        />
                                    </Button>
                                    {currentUser.showUpdateModal &&
                                        <div className="absolute right-5 top-0">
                                            <div className="relative">
                                                <div className="absolute rounded-full h-2 w-2 bg-linear-to-r from-blue-600 to-violet-600 opacity-75"/>
                                                <div className="rounded-full h-2 w-2 bg-linear-to-r from-blue-600 to-violet-600 animate-ping"/>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem className="block focus:bg-transparent cursor-default">
                                    <p className="text-sm font-medium text-primary">
                                        {currentUser?.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {currentUser?.email}
                                    </p>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuGroup className="space-y-1">
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile/$username" params={{ username: currentUser.name! }}>
                                            <User/>
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/features">
                                            <Sparkles/>
                                            Features
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/stats/$username" params={{ username: currentUser.name! }}>
                                            <ChartNoAxesColumn/>
                                            My Stats
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/achievements/$username" params={{ username: currentUser.name! }}>
                                            <Trophy/>
                                            Achievements
                                        </Link>
                                    </DropdownMenuItem>
                                    {currentUser.role === RoleType.MANAGER &&
                                        <DropdownMenuItem className="focus:bg-app-rating/10" asChild>
                                            <Link to="/admin">
                                                <ShieldCheck className="text-app-rating"/>
                                                <span className="text-app-rating">Admin Panel</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    }
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator/>
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link to="/settings">
                                            <Settings/>
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="focus:bg-red-500/10" onSelect={logoutUser}>
                                        <LogOut/>
                                        <span className="text-red-500">Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-muted-foreground hover:text-primary"
                        >
                            {isMobileMenuOpen ? <X className="size-6"/> : <Menu className="size-6"/>}
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen &&
                    <div className="lg:hidden absolute left-0 right-0 z-50 border-b bg-background p-4 animate-in slide-in-from-top-5">
                        <div className="relative mb-4 flex-1 mx-auto max-w-md z-50 block">
                            <SearchBar setMobileMenu={setIsMobileMenuOpen}/>
                        </div>

                        <div className="p-2 max-h-[70vh] overflow-y-auto scrollbar-thin mt-3">
                            <div className="flex flex-wrap justify-around items-center gap-2 px-2">
                                <Link to="/hall-of-fame" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-app-accent">
                                        <Crown className="size-5"/>
                                        <span className="text-[10px]">HoF</span>
                                    </button>
                                </Link>
                                <Link to="/platform-stats" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-app-accent">
                                        <BarChart2 className="size-5"/>
                                        <span className="text-[10px]">Stats</span>
                                    </button>
                                </Link>
                                <Link to="/trends" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-app-accent">
                                        <TrendingUp className="size-5"/>
                                        <span className="text-[10px]">Trends</span>
                                    </button>
                                </Link>
                                <Link to="/moviedle" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-app-accent">
                                        <Popcorn className="size-5"/>
                                        <span className="text-[10px]">Moviedle</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </nav>
    );
};
