import {useRef} from "react";
import {Link} from "react-router-dom";
import {LuAlignJustify} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {useUser} from "@/providers/UserProvider";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {CaretSortIcon} from "@radix-ui/react-icons";
import {SearchBar} from "@/components/navbar/SearchBar";
import {Loading} from "@/components/primitives/Loading";
import {FaCog, FaSignOutAlt, FaUser} from "react-icons/fa";
import {NavMediaDrop} from "@/components/navbar/NavMediaDrop";
import {NavMediaItem} from "@/components/navbar/NavMediaItem";
import {Notifications} from "@/components/navbar/Notifications";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";


export const Navbar = () => {
    const popRef = useRef();
    const { currentUser, logout } = useUser();
    const { sheetOpen, setSheetOpen } = useSheet();

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
                                {/*<NavigationMenuItem>*/}
                                {/*    <SearchBar/>*/}
                                {/*</NavigationMenuItem>*/}
                                {/*<NavigationMenuItem>*/}
                                {/*    <Link to="/hall_of_fame">*/}
                                {/*        <NavigationMenuLink className={navigationMenuTriggerStyle()}>*/}
                                {/*            HoF*/}
                                {/*        </NavigationMenuLink>*/}
                                {/*    </Link>*/}
                                {/*</NavigationMenuItem>*/}
                                {/*<NavigationMenuItem>*/}
                                {/*    <Link to="/global_stats">*/}
                                {/*        <NavigationMenuLink className={navigationMenuTriggerStyle()}>*/}
                                {/*            Stats*/}
                                {/*        </NavigationMenuLink>*/}
                                {/*    </Link>*/}
                                {/*</NavigationMenuItem>*/}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                    {/*<div className="hidden lg:block">*/}
                    {/*    <NavigationMenu>*/}
                    {/*        <NavigationMenuList>*/}
                    {/*            <NavigationMenuItem>*/}
                    {/*                <Link to="/">*/}
                    {/*                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>*/}
                    {/*                        Login / Register*/}
                    {/*                    </NavigationMenuLink>*/}
                    {/*                </Link>*/}
                    {/*            </NavigationMenuItem>*/}
                    {/*        </NavigationMenuList>*/}
                    {/*    </NavigationMenu>*/}
                    {/*</div>*/}
                    {/*<div className="lg:hidden ml-auto mr-2">*/}
                    {/*    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>*/}
                    {/*        <SheetTrigger>*/}
                    {/*            <Button variant="ghost" size="icon">*/}
                    {/*                <LuAlignJustify size={25}/>*/}
                    {/*            </Button>*/}
                    {/*        </SheetTrigger>*/}
                    {/*        <SheetContent side="left" className="max-sm:w-full overflow-y-auto">*/}
                    {/*            <NavigationMenu className="mt-4">*/}
                    {/*                <NavigationMenuList className="flex flex-col items-start gap-3">*/}
                    {/*                    <NavigationMenuItem className="mt-4">*/}
                    {/*                        <SearchBar/>*/}
                    {/*                    </NavigationMenuItem>*/}
                    {/*                    <NavigationMenuItem>*/}
                    {/*                        <Link to="/hall_of_fame" onClick={() => setSheetOpen(false)}>*/}
                    {/*                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>*/}
                    {/*                                HoF*/}
                    {/*                            </NavigationMenuLink>*/}
                    {/*                        </Link>*/}
                    {/*                    </NavigationMenuItem>*/}
                    {/*                    <NavigationMenuItem>*/}
                    {/*                        <Link to="/global_stats" onClick={() => setSheetOpen(false)}>*/}
                    {/*                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>*/}
                    {/*                                Stats*/}
                    {/*                            </NavigationMenuLink>*/}
                    {/*                        </Link>*/}
                    {/*                    </NavigationMenuItem>*/}
                    {/*                </NavigationMenuList>*/}
                    {/*            </NavigationMenu>*/}
                    {/*        </SheetContent>*/}
                    {/*    </Sheet>*/}
                    {/*</div>*/}
                </div>
            </nav>
        );
    }

    return (
        <nav className="z-50 fixed top-0 w-full h-16 border-b shadow-sm flex items-center bg-gray-900 border-b-neutral-500">
            <div className="md:max-w-screen-xl flex w-full justify-between items-center mx-auto container">
                {currentUser === undefined ?
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
                                        <Link to="/hall_of_fame">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                HoF
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link to="/global_stats">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Stats
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Link to="/trends">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Trends
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                        <div className="hidden lg:block">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link to="/coming_next">
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                Coming Next
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenuItem>
                                        <Notifications/>
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
                                            <PopoverContent align="end" className="w-50 p-2">
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
                                                            <Link to="#" onClick={logout} className="block select-none
                                                            space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                            transition-colors hover:bg-accent hover:text-accent-foreground
                                                            focus:bg-accent focus:text-accent-foreground">
                                                                <div className="grid grid-cols-3">
                                                                    <div>{<FaSignOutAlt className="text-grey"/>}</div>
                                                                    <div className="col-span-2">Logout</div>
                                                                </div>
                                                            </Link>
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
                                <SheetTrigger>
                                    <Button variant="ghost" size="icon">
                                        <LuAlignJustify size={25}/>
                                    </Button>
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
                                                <Link to="/hall_of_fame" onClick={() => setSheetOpen(false)}>
                                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                        HoF
                                                    </NavigationMenuLink>
                                                </Link>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <Link to="/global_stats" onClick={() => setSheetOpen(false)}>
                                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                        Stats
                                                    </NavigationMenuLink>
                                                </Link>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <Link to="/trends" onClick={() => setSheetOpen(false)}>
                                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                        Trends
                                                    </NavigationMenuLink>
                                                </Link>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
                                                <Link to="/coming_next" onClick={() => setSheetOpen(false)}>
                                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                        Coming Next
                                                    </NavigationMenuLink>
                                                </Link>
                                            </NavigationMenuItem>
                                            <Separator/>
                                            <NavigationMenuItem>
                                                <Notifications isMobile/>
                                            </NavigationMenuItem>
                                            <NavigationMenuItem>
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
                                                        <Link to="#" onClick={logout} className="block select-none
                                                        space-y-1 rounded-md p-3 leading-none no-underline outline-none
                                                        transition-colors hover:bg-accent hover:text-accent-foreground
                                                        focus:bg-accent focus:text-accent-foreground">
                                                            <div
                                                                className="grid grid-cols-3 text-lg font-semibold pb-2 items-center">
                                                                <div>{<FaSignOutAlt
                                                                    className="text-grey"/>}</div>
                                                                <div className="col-span-2">Logout</div>
                                                            </div>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            </NavigationMenuItem>
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
