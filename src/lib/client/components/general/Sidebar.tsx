import {MediaType} from "@/lib/utils/enums";
import {SquareArrowOutUpRight} from "lucide-react";
import {getMediaColor} from "@/lib/utils/functions";
import {Link, LinkProps} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";


type SidebarTabItem<T> = {
    data: T;
    is: "tab";
};

type SidebarLinkItem = {
    is: "link";
    external?: boolean;
    to: LinkProps["to"];
    sidebarTitle: string;
    isSelected?: boolean;
    mediaType?: MediaType;
    search?: LinkProps["search"];
    params?: LinkProps["params"];
};

export type SideBarItem<T> = SidebarTabItem<T> | SidebarLinkItem | "separator";


interface SidebarProps<T extends { sidebarTitle: string }> {
    selectedItem?: T;
    onTabChange: (item: T) => void;
    items: readonly SideBarItem<T>[];
}


export const Sidebar = <T extends { sidebarTitle: string }>({ items, selectedItem, onTabChange }: SidebarProps<T>) => {
    return (
        <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
            {items.map((item, idx) => {
                if (item === "separator") {
                    return <Separator key={`sep-${idx}`} className="my-3"/>;
                }

                if (item.is === "tab") {
                    const isSelected = selectedItem?.sidebarTitle === item.data.sidebarTitle;
                    return (
                        <Button
                            key={item.data.sidebarTitle}
                            className="justify-start text-sm"
                            variant={isSelected ? "emeraldy" : "ghost"}
                            onClick={() => onTabChange(item.data)}
                        >
                            {item.data.sidebarTitle}
                        </Button>
                    );
                }

                if (item.is === "link") {
                    return (
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
                    );
                }

                return null;
            })}
        </nav>
    );
};