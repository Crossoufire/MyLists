import {JSX} from "react";
import {ExternalLink} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {getMediaColor} from "@/lib/utils/functions";
import {Separator} from "@/lib/components/ui/separator";


interface SidebarItem {
    component: JSX.Element;
    sidebarTitle: string;
}


interface SidebarItem2 {
    sidebarTitle: string;
    [key: string]: any;
}


interface SidebarLinkItem {
    to: string;
    external?: boolean;
    sidebarTitle: string;
    isSelected?: boolean;
    mediaType?: MediaType;
}


interface SidebarProps {
    selectedTab: string;
    linkItems?: SidebarLinkItem[];
    onTabChange: (tab: string) => void;
    items: readonly SidebarItem[] | SidebarItem2[];
}


export const Sidebar = ({ items, selectedTab, onTabChange, linkItems = [] }: SidebarProps) => {
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
            {linkItems.length > 0 && <Separator/>}
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
