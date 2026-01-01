import {ReactNode} from "react";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";


export interface SidebarItem {
    id: string;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    render?: () => ReactNode;
    type?: "item" | "separator";
}


export const Sidebar = ({ items }: { items: SidebarItem[] }) => {
    return (
        <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
            {items.map((item, idx) => {
                if (item.type === "separator") {
                    return <Separator key={idx} className="my-3"/>;
                }

                return (
                    <Button
                        key={item.id}
                        onClick={item.onClick}
                        className="justify-start text-sm"
                        variant={item.isActive ? "emeraldy" : "ghost"}
                    >
                        {item.label}
                        {item.render?.()}
                    </Button>
                );
            })}
        </nav>
    );
};
