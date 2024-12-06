import React from "react";
import {cn} from "@/utils/functions";
import {Link} from "@tanstack/react-router";
import {useSheet} from "@/providers/SheetProvider";
import {useAuth, useModalMutation} from "@mylists/api/src";
import {NavigationMenuLink} from "@/components/ui/navigation-menu";


export const NavMediaItem = ({ to, icon, text, className, popRef }) => {
    const { currentUser } = useAuth();
    const { setSheetOpen } = useSheet();
    const modalUpdate = useModalMutation();

    const handleClosePopover = () => {
        popRef?.current?.click();
        setSheetOpen(false);
    };

    const handleNewFeatures = () => {
        if (currentUser.show_update_modal && text === "Features") {
            modalUpdate.mutate(undefined);
        }
    };

    return (
        <li>
            <NavigationMenuLink asChild onClick={handleClosePopover}>
                <Link to={to} onClick={handleNewFeatures} className={cn("block select-none space-y-1 rounded-md p-3 " +
                    "leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground " +
                    "focus:bg-accent focus:text-accent-foreground", className)}>
                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <div>{icon}</div>
                            <div>{text}</div>
                        </div>
                        {(currentUser.show_update_modal && text === "Features") &&
                            <div className="absolute right-5 top-0">
                                <div className="relative">
                                    <div className="absolute text-xs -top-2 -right-[53px] bg-gradient-to-r from-blue-600 to-violet-600
                                    rounded-full px-2 py-0.5 z-10">
                                        New
                                    </div>
                                    <div className="absolute -top-2 -right-[53px] bg-gradient-to-r from-blue-600 to-violet-600
                                    rounded-full h-[20px] w-[40px] animate-ping"/>
                                </div>
                            </div>
                        }
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    );
};