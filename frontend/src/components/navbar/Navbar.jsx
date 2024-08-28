import {useRef} from "react";
import {LuAlignJustify} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {useUser} from "@/providers/UserProvider";
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


export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}


export const Navbar = () => {
    const popRef = useRef();
    const navigate = useNavigate();
    const { currentUser, logout } = useUser();
    const { sheetOpen, setSheetOpen } = useSheet();

    const logoutUser = async () => {
        await logout();
        await sleep(5);
        await navigate({ to: "/" });
    };

    // Login page and public pages when not logged
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
                                        <Button variant="invisible" className="flex items-center gap-2 text-lg
                                        font-semibold px-1">
                                            <img
                                                alt="profile-picture"
                                                src={currentUser.profile_image}
                                                className="h-10 w-10 rounded-full"
                                            />
                                            <CaretSortIcon/>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverClose ref={popRef} className="absolute"/>
                                    <PopoverContent align="end" className="w-36 p-2">
                                        <ul>
                                            <NavMediaItem
                                                popRef={popRef}
                                                text={"Profile"}
                                                icon={<FaUser className="text-grey"/>}
                                                to={`/profile/${currentUser.username}`}
                                            />
                                            <NavMediaItem
                                                to="/settings"
                                                text="Settings"
                                                popRef={popRef}
                                                icon={<FaCog className="text-grey"/>}
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
                                        <SearchBar currentUser={currentUser}/>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavMediaDrop currentUser={currentUser}/>
                                    </Nav.NavigationMenuItem>
                                    <Separator/>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/hall-of-fame" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            HoF
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/global-stats" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            Stats
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/trends" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
                                            Trends
                                        </NavLink>
                                    </Nav.NavigationMenuItem>
                                    <Nav.NavigationMenuItem>
                                        <NavLink to="/coming-next" className={Nav.navigationMenuTriggerStyle()} onClick={() => setSheetOpen(false)}>
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
                                            icon={<FaUser className="text-grey"/>}
                                            to={`/profile/${currentUser.username}`}
                                            className="text-lg items-center font-semibold pb-2"
                                        />
                                        <NavMediaItem
                                            to="/settings"
                                            text="Settings"
                                            icon={<FaCog className="text-grey"/>}
                                            className="text-lg items-center font-semibold pb-2"
                                        />
                                        <li>
                                            <Nav.NavigationMenuLink asChild>
                                                <NavLink to="#" onClick={logoutUser} className="block select-none
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
