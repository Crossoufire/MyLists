import {Button} from "@/components/ui/button";


export const Sidebar = ({ items, selectedTab, onTabChange }) => {
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
        </nav>
    );
};
