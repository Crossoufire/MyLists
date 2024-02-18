import {cn} from "@/lib/utils";
import {Link} from "react-router-dom";
import {useSheet} from "@/providers/SheetProvider";
import {NavigationMenuLink} from "@/components/ui/navigation-menu";


export const NavMediaItem = ({ to, icon, text, className, popRef }) => {
    const { setSheetOpen } = useSheet();

    const handleClosePopover = () => {
        popRef?.current?.click();
        setSheetOpen(false)
    }

    return (
        <li>
            <NavigationMenuLink asChild onClick={handleClosePopover}>
                <Link to={to} className={cn("block select-none space-y-1 rounded-md p-3 leading-none no-underline " +
                "outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent " +
                "focus:text-accent-foreground", className)}>
                    <div className="grid grid-cols-3 items-center">
                        <div>{icon}</div>
                        <div className="col-span-2">{text}</div>
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    )
};