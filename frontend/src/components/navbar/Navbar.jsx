import {userClient} from "@/api/MyApiClient";
import {LuAlignJustify} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {CaretSortIcon} from "@radix-ui/react-icons";
import * as Nav from "@/components/ui/navigation-menu";
import {SearchBar} from "@/components/navbar/SearchBar";
import {FaCog, FaSignOutAlt, FaUser} from "react-icons/fa";
import {NavMediaDrop} from "@/components/navbar/NavMediaDrop";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Notifications} from "@/components/navbar/Notifications";
import {Link as NavLink, useNavigate} from "@tanstack/react-router";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const Navbar = () => {
    const popRef = useRef();
    const navigate = useNavigate();
    const { sheetOpen, setSheetOpen } = useSheet();
    const [currentUser, setCurrentUser] = useState(userClient.currentUser);

    useEffect(() => {
        const navbarCurrentUserChange = (newData) => {
            setCurrentUser(newData);
        };
        userClient.subscribe(navbarCurrentUserChange);
        return () => userClient.unsubscribe(navbarCurrentUserChange);
    }, []);

    const logoutUser = async () => {
        await userClient.logout();
        return navigate({ to: "/" });
    };

    // Login page and public pages
    if (currentUser === null) {
        return (
            <nav className="z-50 fixed top-0 w-full h-16 border-b flex items-center bg-background border-b-neutral-700">
                <div className="md:max-w-screen-xl flex w-full justify-between items-center mx-auto container">
                    <Nav.NavigationMenu>
                        <Nav.NavigationMenuList>
                            <Nav.NavigationMenuItem>
                                <p className="text-lg font-semibold mr-2">MyLists</p>
                            </Nav.NavigationMenuItem>
                        </Nav.NavigationMenuList>
                    </Nav.NavigationMenu>
                </div>
            </nav>
        );
    }

    return (
        <nav className="z-50 fixed top-0 w-full h-16 border-b flex items-center bg-background border-b-neutral-700">
            <div className="md:max-w-screen-xl flex w-full justify-between items-center mx-auto container">
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
                                <NavLink to="/hall_of_fame" className={Nav.navigationMenuTriggerStyle()}>
                                    HoF
                                </NavLink>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <NavLink to="/global_stats" className={Nav.navigationMenuTriggerStyle()}>
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
                                <NavLink to="/coming_next" className={Nav.navigationMenuTriggerStyle()}>
                                    Coming Next
                                </NavLink>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
                                <Notifications/>
                            </Nav.NavigationMenuItem>
                            <Nav.NavigationMenuItem>
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
                                                <Nav.NavigationMenuLink asChild>
                                                    <NavLink to="#" onClick={logoutUser} className="block select-none
                                                    space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                    transition-colors hover:bg-accent hover:text-accent-foreground
                                                    focus:bg-accent focus:text-accent-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div>{<FaSignOutAlt className="text-grey"/>}</div>
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
                        <SheetContent side="left" className="max-sm:w-full overflow-y-auto">
                            <Nav.NavigationMenu className="mt-4">
                                <Nav.NavigationMenuList className="flex flex-col items-start gap-3">
                                    <Nav.NavigationMenuItem className="mt-4">
                                        <SearchBar/>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavMediaDrop/>
                                    </Nav.NavigationMenuItem>
                                    <Separator/>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/hall_of_fame" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            HoF
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/global_stats" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            Stats
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/trends" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            Trends
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/coming_next" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            Coming Next
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Separator/>
                                    <Nav.NavigationMenuItem>
                                        <Notifications isMobile/>
                                    </Nav.NavigationMenuItem>
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
                                            <Nav.NavigationMenuLink asChild>
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
