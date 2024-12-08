import {useRef} from "react";
import {router} from "@/router";
import {useAuth} from "@mylists/api/src";
import {Button} from "@/components/ui/button";
import {queryClient} from "@/libs/queryClient";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {SearchBar} from "@/components/navbar/SearchBar";
import {NavMediaDrop} from "@/components/navbar/NavMediaDrop";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Notifications} from "@/components/navbar/Notifications";
import {Link as NavLink, useLocation, useNavigate} from "@tanstack/react-router";
import {LuAlignJustify, LuLogOut, LuSettings, LuSparkles, LuUser} from "react-icons/lu";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navStyle} from "@/components/ui/navigation-menu";


export const Navbar = () => {
    const popRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const { sheetOpen, setSheetOpen } = useSheet();

    const logoutUser = () => {
        logout.mutate(undefined, {
            onSuccess: async () => {
                queryClient.clear();
                await router.invalidate().then(() => {
                    navigate({ to: "/" });
                });
            },
        });
    };

    // Login page and public pages when not logged
    if (!currentUser) {
        return (
            <nav className="w-screen z-50 flex items-center fixed top-0 h-16 border-b border-b-neutral-700 bg-background">
                <div className="md:max-w-screen-xl flex w-full justify-between items-center container">
                    <NavLink to="/" className="text-lg font-semibold">MyLists</NavLink>
                    {location.pathname !== "/" &&
                        <div className="space-x-3">
                            <Button size="sm" asChild>
                                <NavLink to="/">Login</NavLink>
                            </Button>
                            <Button size="sm" variant="secondary" asChild>
                                <NavLink to="/">Register</NavLink>
                            </Button>
                        </div>
                    }
                </div>
            </nav>
        );
    }

    return (
        <nav className="w-screen z-50 flex items-center fixed top-0 h-16 border-b border-b-neutral-700 bg-background">
            <div className="md:max-w-screen-xl flex w-full justify-between items-center container">
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
                                <NavLink to="/global-stats" className={navStyle()}>
                                    Stats
                                </NavLink>
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
                                                    src={currentUser.profile_image}
                                                    className="h-10 w-10 rounded-full"
                                                />
                                                <CaretSortIcon className="opacity-80"/>
                                            </Button>
                                            {currentUser.show_update_modal &&
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
                                                icon={<LuUser/>}
                                                to={`/profile/${currentUser.username}`}
                                            />
                                            <NavMediaItem
                                                to="/settings"
                                                text="Settings"
                                                popRef={popRef}
                                                icon={<LuSettings/>}
                                            />
                                            <NavMediaItem
                                                to="/features"
                                                text="Features"
                                                popRef={popRef}
                                                icon={<LuSparkles/>}
                                            />
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    <NavLink to="#" onClick={logoutUser} className="block select-none
                                                    space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                    transition-colors hover:bg-accent hover:text-accent-foreground
                                                    focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div>{<LuLogOut className="text-grey"/>}</div>
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
                            <LuAlignJustify size={28}/>
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
                                        <NavLink to="/global-stats" className={navStyle()} onClick={() => setSheetOpen(false)}>
                                            Stats
                                        </NavLink>
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
                                            icon={<LuUser/>}
                                            to={`/profile/${currentUser.username}`}
                                            className="items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/settings"
                                            text="Settings"
                                            icon={<LuSettings/>}
                                            className="items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/features"
                                            text="Features"
                                            icon={<LuSparkles/>}
                                            className="items-center font-semibold pb-2"
                                        />
                                        <li>
                                            <NavigationMenuLink asChild>
                                                <NavLink to="#" onClick={logoutUser} className="block select-none
                                                space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                transition-colors hover:bg-accent hover:text-accent-foreground
                                                focus:bg-accent focus:text-accent-foreground">
                                                    <div className="grid grid-cols-3 font-semibold pb-2 items-center">
                                                        <div>{<LuLogOut/>}</div>
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
