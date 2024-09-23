import React, {useRef} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {Button} from "@/components/ui/button";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {Loading} from "@/components/app/base/Loading";
import * as Nav from "@/components/ui/navigation-menu";
import {SearchBar} from "@/components/navbar/SearchBar";
import {NavMediaDrop} from "@/components/navbar/NavMediaDrop";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Notifications} from "@/components/navbar/Notifications";
import {Link as NavLink, useNavigate, useRouter} from "@tanstack/react-router";
import {LuAlignJustify, LuLogOut, LuSettings, LuSparkles, LuUser} from "react-icons/lu";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";


export const Navbar = () => {
    const popRef = useRef();
    const router = useRouter();
    const navigate = useNavigate();
    const { sheetOpen, setSheetOpen } = useSheet();
    const { currentUser, logout, isLoading } = useAuth();

    const logoutUser = () => {
        logout.mutate(undefined, {
            onSuccess: async () => {
                router.invalidate().then(() => {
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
                    <div>{isLoading && <Loading/>}</div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="w-screen z-50 flex items-center fixed top-0 h-16 border-b border-b-neutral-700 bg-background">
            <div className="md:max-w-screen-xl flex w-full justify-between items-center container">
                <div className="hidden lg:block">
                    <Nav.NavigationMenu>
                        <Nav.NavigationMenuList>
                            <Nav.NavigationMenuItem>
                                <NavMediaDrop/>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <SearchBar/>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <NavLink to="/hall-of-fame" className={Nav.navigationMenuTriggerStyle()}>
                                    HoF
                                </NavLink>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <NavLink to="/global-stats" className={Nav.navigationMenuTriggerStyle()}>
                                    Stats
                                </NavLink>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <NavLink to="/trends" className={Nav.navigationMenuTriggerStyle()}>
                                    Trends
                                </NavLink>
                            </Nav.NavigationMenuItem>
                        </Nav.NavigationMenuList>
                    </Nav.NavigationMenu>
                </div>
                <div className="hidden lg:block">
                    <Nav.NavigationMenu>
                        <Nav.NavigationMenuList>
                            <Nav.NavigationMenuItem>
                                <NavLink to="/coming-next" className={Nav.navigationMenuTriggerStyle()}>
                                    Coming Next
                                </NavLink>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <Notifications/>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
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
                                                icon={<LuUser className="text-grey"/>}
                                                to={`/profile/${currentUser.username}`}
                                            />
                                            <NavMediaItem
                                                to="/settings"
                                                text="Settings"
                                                popRef={popRef}
                                                icon={<LuSettings className="text-grey"/>}
                                            />
                                            <NavMediaItem
                                                to="/features"
                                                text="Features"
                                                popRef={popRef}
                                                icon={<LuSparkles className="text-grey"/>}
                                            />
                                            <li>
                                                <Nav.NavigationMenuLink asChild>
                                                    <NavLink to="#" onClick={logoutUser} className="block select-none
                                                    space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                    transition-colors hover:bg-accent hover:text-accent-foreground
                                                    focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div>{<LuLogOut className="text-grey"/>}</div>
                                                            <div>Logout</div>
                                                        </div>
                                                    </NavLink>
                                                </Nav.NavigationMenuLink>
                                            </li>
                                        </ul>
                                    </PopoverContent>
                                </Popover>
                            </Nav.NavigationMenuItem>
                        </Nav.NavigationMenuList>
                    </Nav.NavigationMenu>
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
                            <Nav.NavigationMenu className="mt-3">
                                <Nav.NavigationMenuList className="flex flex-col items-start gap-3">
                                    <Nav.NavigationMenuItem className="mt-4">
                                        <SearchBar currentUser={currentUser}/>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavMediaDrop currentUser={currentUser}/>
                                    </Nav.NavigationMenuItem>
                                    <Separator/>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/hall-of-fame" className={Nav.navigationMenuTriggerStyle()}
                                                 onClick={() => setSheetOpen(false)}>
                                            HoF
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/global-stats" className={Nav.navigationMenuTriggerStyle()}
                                                 onClick={() => setSheetOpen(false)}>
                                            Stats
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/trends" className={Nav.navigationMenuTriggerStyle()}
                                                 onClick={() => setSheetOpen(false)}>
                                            Trends
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/coming-next" className={Nav.navigationMenuTriggerStyle()}
                                                 onClick={() => setSheetOpen(false)}>
                                            Coming Next
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Separator/>
                                    <Nav.NavigationMenuItem>
                                        <Notifications isMobile/>
                                    </Nav.NavigationMenuItem>
                                    <div>
                                        <NavMediaItem
                                            text="Profile"
                                            icon={<LuUser className="text-grey"/>}
                                            to={`/profile/${currentUser.username}`}
                                            className="text-lg items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/settings"
                                            text="Settings"
                                            icon={<LuSettings className="text-grey"/>}
                                            className="text-lg items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/features"
                                            text="Features"
                                            icon={<LuSparkles className="text-grey"/>}
                                            className="text-lg items-center font-semibold pb-2"
                                        />
                                        <li>
                                            <Nav.NavigationMenuLink asChild>
                                                <NavLink to="#" onClick={logoutUser} className="block select-none
                                                space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                transition-colors hover:bg-accent hover:text-accent-foreground
                                                focus:bg-accent focus:text-accent-foreground">
                                                    <div className="grid grid-cols-3 text-lg font-semibold pb-2 items-center">
                                                        <div>{<LuLogOut className="text-grey"/>}</div>
                                                        <div className="col-span-2">Logout</div>
                                                    </div>
                                                </NavLink>
                                            </Nav.NavigationMenuLink>
                                        </li>
                                    </div>
                                </Nav.NavigationMenuList>
                            </Nav.NavigationMenu>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};
