import React from "react";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {useSheet} from "@/lib/client/contexts/sheet-context";
import {NavigationMenuLink} from "@/lib/client/components/ui/navigation-menu";
import {useFeatureFlagMutation} from "@/lib/client/react-query/query-mutations/user.mutations";


interface NavMediaItemProps {
    to: string;
    text: string;
    className?: string;
    icon: React.ReactNode;
    popRef?: React.RefObject<HTMLButtonElement | null>;
}


export const NavMediaItem = ({ to, icon, text, className, popRef }: NavMediaItemProps) => {
    const { currentUser } = useAuth();
    const { setSheetOpen } = useSheet();
    const featureFlagMutation = useFeatureFlagMutation();

    const handleClosePopover = () => {
        popRef?.current?.click();
        setSheetOpen(false);
    };

    const handleNewFeatures = () => {
        if (currentUser?.showUpdateModal && text === "Features") {
            featureFlagMutation.mutate(undefined);
        }
    };

    return (
        <li>
            <NavigationMenuLink asChild onClick={handleClosePopover}>
                <Link to={to} onClick={handleNewFeatures} className={cn("block select-none space-y-1 rounded-md p-3 " +
                    "leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground " +
                    "focus:bg-accent focus:text-accent-foreground", className)}>
                    <div className="relative">
                        <div className="flex gap-3">
                            <div>{icon}</div>
                            <div>{text}</div>
                        </div>
                        {(currentUser?.showUpdateModal && text === "Features") &&
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