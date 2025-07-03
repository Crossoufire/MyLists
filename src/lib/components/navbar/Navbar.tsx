import {SearchBar} from "./SearchBar";
import {useAuth} from "@/lib/hooks/use-auth";
import React, {useRef, useState} from "react";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {useQueryClient} from "@tanstack/react-query";
import {useSheet} from "@/lib/contexts/sheet-context";
import {Separator} from "@/lib/components/ui/separator";
import {LoginForm} from "@/lib/components/auth/LoginForm";
import {RegisterForm} from "@/lib/components/auth/RegisterForm";
import {NavMediaDrop} from "@/lib/components/navbar/NavMediaDrop";
import {NavMediaItem} from "@/lib/components/navbar/NavMediaItem";
import {Notifications} from "@/lib/components/navbar/Notifications";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {Link as NavLink, useNavigate, useRouter} from "@tanstack/react-router";
import {ChevronDown, LogOut, Menu, Settings, Sparkles, User} from "lucide-react";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/lib/components/ui/sheet";
import {NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navStyle} from "@/lib/components/ui/navigation-menu";


export const Navbar = () => {
    const router = useRouter();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { sheetOpen, setSheetOpen } = useSheet();
    const popRef = useRef<HTMLButtonElement>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const logoutUser = async () => {
        await authClient.signOut();
        await router.invalidate();
        queryClient.setQueryData(queryKeys.authKey(), null);
        await navigate({ to: "/", replace: true });
        queryClient.removeQueries();
    };

    // Login page and public pages when not logged
    if (!currentUser) {
        return (
            <nav className="w-screen z-50 flex items-center fixed top-0 h-16 border-b border-b-neutral-700 bg-background">
                <div className="md:max-w-screen-xl flex w-full justify-between items-center container mx-auto">
                    <NavLink to="/" className="text-lg font-semibold">MyLists</NavLink>
                    <div className="space-x-3">
                        <Button size="sm" onClick={() => setShowLogin(true)}>
                            Login
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setShowRegister(true)}>
                            Register
                        </Button>
                    </div>
                    <LoginForm open={showLogin} onOpenChange={setShowLogin}/>
                    <RegisterForm open={showRegister} onOpenChange={setShowRegister}/>
                </div>
            </nav>
        );
    }

    return (
        <nav className="w-screen z-50 flex items-center fixed top-0 h-16 border-b border-b-neutral-700 bg-background">
            <div className="mx-auto md:max-w-screen-xl flex w-full justify-between items-center container">
                <div className="hidden lg:block">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavMediaDrop/>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <SearchBar/>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavLink to="/hall-of-fame" className={navStyle()}>
                                    HoF
                                </NavLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                {/*<NavLink to="/global-stats" className={navStyle()}>*/}
                                {/*    Stats*/}
                                {/*</NavLink>*/}
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavLink to="/trends" className={navStyle()}>
                                    Trends
                                </NavLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavLink to="/moviedle" className={navStyle()}>
                                    Moviedle
                                </NavLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="hidden lg:block">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavLink to="/coming-next" className={navStyle()}>
                                    Coming Next
                                </NavLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <Notifications/>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div className="relative">
                                            <Button variant="invisible" className="flex items-center gap-2 text-lg font-semibold px-1">
                                                <img
                                                    alt="profile-picture"
                                                    src={currentUser.image!}
                                                    className="h-10 w-10 rounded-full"
                                                />
                                                <ChevronDown className="w-3 h-3 opacity-80"/>
                                            </Button>
                                            {currentUser.showUpdateModal &&
                                                <div className="absolute right-5 top-0">
                                                    <div className="relative">
                                                        <div className="absolute rounded-full h-2 w-2 bg-gradient-to-r from-blue-600 to-violet-600 opacity-75"/>
                                                        <div className="rounded-full h-2 w-2 bg-gradient-to-r from-blue-600 to-violet-600 animate-ping"/>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverClose ref={popRef} className="absolute"/>
                                    <PopoverContent align="end" className="w-36 p-2">
                                        <ul>
                                            <NavMediaItem
                                                popRef={popRef}
                                                text={"Profile"}
                                                icon={<User className="w-4 h-4"/>}
                                                to={`/profile/${currentUser.name}`}
                                            />
                                            <NavMediaItem
                                                to="/settings"
                                                text="Settings"
                                                popRef={popRef}
                                                icon={<Settings className="w-4 h-4"/>}
                                            />
                                            <NavMediaItem
                                                to="/features"
                                                text="Features"
                                                popRef={popRef}
                                                icon={<Sparkles className="w-4 h-4"/>}
                                            />
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    {/*//@ts-expect-error*/}
                                                    <NavLink to="#" onClick={logoutUser} className="block select-none
                                                    space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                    transition-colors hover:bg-accent hover:text-accent-foreground
                                                    focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div><LogOut className="w-4 h-4"/></div>
                                                            <div>Logout</div>
                                                        </div>
                                                    </NavLink>
                                                </NavigationMenuLink>
                                            </li>
                                        </ul>
                                    </PopoverContent>
                                </Popover>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="lg:hidden ml-auto mr-2">
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger className="flex items-center">
                            <Menu size={28}/>
                        </SheetTrigger>
                        <SheetContent side="left" className="max-sm:w-full">
                            <SheetHeader>
                                <SheetTitle></SheetTitle>
                                <SheetDescription></SheetDescription>
                            </SheetHeader>
                            <NavigationMenu className="mt-3">
                                <NavigationMenuList className="flex flex-col items-start gap-3">
                                    <NavigationMenuItem className="mt-4">
                                        <SearchBar/>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavMediaDrop/>
                                    </NavigationMenuItem>
                                    <Separator/>
                                    <NavigationMenuItem>
                                        <NavLink to="/hall-of-fame" className={navStyle()} onClick={() => setSheetOpen(false)}>
                                            HoF
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        {/*<NavLink to="/global-stats" className={navStyle()} onClick={() => setSheetOpen(false)}>*/}
                                        {/*    Stats*/}
                                        {/*</NavLink>*/}
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavLink to="/trends" className={navStyle()} onClick={() => setSheetOpen(false)}>
                                            Trends
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavLink to="/moviedle" className={navStyle()} onClick={() => setSheetOpen(false)}>
                                            Moviedle
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavLink to="/coming-next" className={navStyle()} onClick={() => setSheetOpen(false)}>
                                            Coming Next
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <Separator/>
                                    <NavigationMenuItem>
                                        <Notifications isMobile/>
                                    </NavigationMenuItem>
                                    <div className="-mt-3">
                                        <NavMediaItem
                                            text="Profile"
                                            icon={<User className="h-4 w-4"/>}
                                            to={`/profile/${currentUser.name}`}
                                            className="items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/settings"
                                            text="Settings"
                                            icon={<Settings className="h-4 w-4"/>}
                                            className="items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/features"
                                            text="Features"
                                            icon={<Sparkles className="h-4 w-4"/>}
                                            className="items-center font-semibold pb-2"
                                        />
                                        <li>
                                            <NavigationMenuLink asChild>
                                                {/*// @ts-expect-error*/}
                                                <NavLink to="#" onClick={logoutUser} className="block select-none
                                                space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                transition-colors hover:bg-accent hover:text-accent-foreground
                                                focus:bg-accent focus:text-accent-foreground">
                                                    <div className="grid grid-cols-3 font-semibold pb-2 items-center">
                                                        <div><LogOut className="w-4 h-4"/></div>
                                                        <div className="col-span-2">Logout</div>
                                                    </div>
                                                </NavLink>
                                            </NavigationMenuLink>
                                        </li>
                                    </div>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};
