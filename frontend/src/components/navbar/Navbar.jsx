import {useRef} from "react";
import {userClient} from "@/api/MyApiClient";
import {LuAlignJustify} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {Loading} from "@/components/app/base/Loading";
import {SearchBar} from "@/components/navbar/SearchBar";
import {FaCog, FaSignOutAlt, FaUser} from "react-icons/fa";
import {NavMediaDrop} from "@/components/navbar/NavMediaDrop";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Notifications} from "@/components/navbar/Notifications";
import {Link as NavLink, useNavigate} from "@tanstack/react-router";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";


export const Navbar = () => {
    const popRef = useRef();
    const navigate = useNavigate();
    const currentUser = userClient.currentUser;
    const { sheetOpen, setSheetOpen } = useSheet();

    const logoutUser = async () => {
        await userClient.logout();
        return navigate({ to: "/" });
    };

    // Login page and public pages
    if (currentUser === null) {
        return (
            <nav className="z-50 fixed top-0 w-full h-16 border-b shadow-sm flex items-center bg-gray-900 border-b-neutral-500">
                <div className="md:max-w-screen-xl flex w-full justify-between items-center mx-auto container">
                    <div className="hidden lg:block">
                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <p className="text-lg font-semibold mr-2">MyLists</p>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="z-50 fixed top-0 w-full h-16 border-b shadow-sm flex items-center bg-gray-900 border-b-neutral-500">
            <div className="md:max-w-screen-xl flex w-full justify-between items-center mx-auto container">
                {!currentUser ?
                    <Loading forPage={false}/>
                    :
                    <>
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
                                        <NavLink to="/hall_of_fame" className={navigationMenuTriggerStyle()}>
                                            HoF
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavLink to="/global_stats" className={navigationMenuTriggerStyle()}>
                                            Stats
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <NavLink to="/trends" className={navigationMenuTriggerStyle()}>
                                            Trends
                                        </NavLink>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                        <div className="hidden lg:block">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <NavLink to="/coming_next" className={navigationMenuTriggerStyle()}>
                                            Coming Next
                                        </NavLink>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        {/*<Notifications/>*/}
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="invisible" className="flex items-center gap-2 text-lg
                                                font-semibold px-1">
                                                    <img
                                                        src={currentUser.profile_image}
                                                        className="h-10 w-10 rounded-full"
                                                        alt="profile-picture"
                                                    />
                                                    <CaretSortIcon/>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverClose ref={popRef} className="absolute"/>
                                            <PopoverContent align="end" className="w-36 p-2">
                                                <ul>
                                                    <NavMediaItem
                                                        to={`/profile/${currentUser.username}`}
                                                        icon={<FaUser className="text-grey"/>}
                                                        text="Profile"
                                                        popRef={popRef}
                                                    />
                                                    <NavMediaItem
                                                        to="/settings"
                                                        icon={<FaCog className="text-grey"/>}
                                                        text="Settings"
                                                        popRef={popRef}
                                                    />
                                                    <li>
                                                        <NavigationMenuLink asChild>
                                                            <NavLink to="#" onClick={logoutUser} className="block select-none
                                                            space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                            transition-colors hover:bg-accent hover:text-accent-foreground
                                                            focus:bg-accent focus:text-accent-foreground">
                                                                <div className="flex items-center gap-3">
                                                                    <div>{<FaSignOutAlt className="text-grey"/>}</div>
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
                                <SheetContent side="left" className="max-sm:w-full overflow-y-auto">
                                    <NavigationMenu className="mt-4">
                                        <NavigationMenuList className="flex flex-col items-start gap-3">
                                            <NavigationMenuItem className="mt-4">
                                                <SearchBar/>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <NavMediaDrop/>
                                            </NavigationMenuItem>
                                            <Separator/>
                                            <NavigationMenuItem>
                                                <NavLink to="/hall_of_fame" className={navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                                    HoF
                                                </NavLink>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <NavLink to="/global_stats" className={navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                                    Stats
                                                </NavLink>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <NavLink to="/trends" className={navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                                    Trends
                                                </NavLink>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <NavLink to="/coming_next" className={navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                                    Coming Next
                                                </NavLink>
                                            </NavigationMenuItem>
                                            <Separator/>
                                            <NavigationMenuItem>
                                                <Notifications isMobile/>
                                            </NavigationMenuItem>
                                            <div>
                                                <NavMediaItem
                                                    to={`/profile/${currentUser.username}`}
                                                    icon={<FaUser className="text-grey"/>}
                                                    text="Profile"
                                                    className="text-lg items-center font-semibold pb-2"
                                                />
                                                <NavMediaItem
                                                    to="/settings"
                                                    icon={<FaCog className="text-grey"/>}
                                                    text="Settings"
                                                    className="text-lg items-center font-semibold pb-2"
                                                />
                                                <li>
                                                    <NavigationMenuLink asChild>
                                                        <NavLink to="#" onClick={userClient.logout} className="block select-none
                                                    space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                    transition-colors hover:bg-accent hover:text-accent-foreground
                                                    focus:bg-accent focus:text-accent-foreground">
                                                            <div
                                                                className="grid grid-cols-3 text-lg font-semibold pb-2 items-center">
                                                                <div>{<FaSignOutAlt
                                                                    className="text-grey"/>}</div>
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
                    </>
                }
            </div>
        </nav>
    );
};
