import {ExternalLink} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";

import {getMediaColor} from "@/utils/functions";


export const Sidebar = ({ items, selectedTab, onTabChange, linkItems = [] }) => {
    return (
        <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
            {items.map(item => (
                <Button
                    key={item.sidebarTitle}
                    className="justify-start text-base"
                    onClick={() => onTabChange(item.sidebarTitle)}
                    variant={selectedTab === item.sidebarTitle ? "secondary" : "ghost"}
                >
                    {item.sidebarTitle}
                </Button>
            ))}
            {linkItems.length > 0 && <Separator variant="large"/>}
            {linkItems.map(item => (
                <Button
                    asChild={true}
                    key={item.sidebarTitle}
                    disabled={item.isSelected}
                    className={"justify-start text-base"}
                    variant={item.isSelected ? "secondary" : "ghost"}
                    style={{ backgroundColor: item.isSelected ? getMediaColor(item.mediaType) : "" }}
                >
                    <Link to={item.to}>
                        {item.sidebarTitle} {item.external && <ExternalLink className="ml-2 w-4 h-4"/>}
                    </Link>
                </Button>
            ))}
        </nav>
    );
};
