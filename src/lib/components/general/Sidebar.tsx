import {Button} from "@/lib/components/ui/button";
import {SquareArrowOutUpRight} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {getMediaColor} from "@/lib/utils/functions";
import {Link, LinkProps} from "@tanstack/react-router";
import {Separator} from "@/lib/components/ui/separator";


export interface SidebarLinkItem {
    external?: boolean;
    to: LinkProps["to"];
    sidebarTitle: string;
    isSelected?: boolean;
    mediaType?: MediaType;
    search?: LinkProps["search"];
    params?: LinkProps["params"];
}


interface SidebarProps<T extends { sidebarTitle: string }> {
    items: readonly T[];
    selectedTab: string;
    linkItems?: SidebarLinkItem[];
    onTabChange: (tab: string) => void;
}


export const Sidebar = <T extends { sidebarTitle: string }>({ items, selectedTab, onTabChange, linkItems = [] }: SidebarProps<T>) => {
    return (
        <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
            {items.map((item) =>
                <Button
                    key={item.sidebarTitle}
                    className="justify-start text-base"
                    onClick={() => onTabChange(item.sidebarTitle)}
                    variant={selectedTab === item.sidebarTitle ? "secondary" : "ghost"}
                >
                    {item.sidebarTitle}
                </Button>
            )}
            {linkItems.length > 0 && <Separator/>}
            {linkItems.map((item) =>
                <Button
                    asChild
                    key={item.sidebarTitle}
                    disabled={item.isSelected}
                    className={"justify-start text-base"}
                    variant={item.isSelected ? "secondary" : "ghost"}
                    style={{ backgroundColor: item.isSelected ? getMediaColor(item.mediaType) : "" }}
                >
                    <Link to={item.to} params={item.params} search={item.search}>
                        {item.sidebarTitle} {item.external && <SquareArrowOutUpRight className="ml-0.5 w-4 h-4"/>}
                    </Link>
                </Button>
            )}
        </nav>
    );
};
