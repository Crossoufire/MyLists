import {cn} from "@/utils/functions";
import {Link} from "@tanstack/react-router";
import {useSheet} from "@/providers/SheetProvider";
import {NavigationMenuLink} from "@/components/ui/navigation-menu";


export const NavMediaItem = ({ to, icon, text, className, popRef }) => {
    const { setSheetOpen } = useSheet();

    const handleClosePopover = () => {
        popRef?.current?.click();
        setSheetOpen(false)
    };

    return (
        <li>
            <NavigationMenuLink asChild onClick={handleClosePopover}>
                <Link to={to} className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline " +
                    "outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent " +
                    "focus:text-accent-foreground", className)}>
                    <div className="flex items-center gap-3">
                        <div>{icon}</div>
                        <div>{text}</div>
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    )
};