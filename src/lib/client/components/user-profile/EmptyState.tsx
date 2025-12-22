import {cn} from "@/lib/utils/helpers";
import {LucideIcon} from "lucide-react";


interface EmptyStateProps {
    icon: LucideIcon;
    message: string;
    className?: string;
}


export const EmptyState = ({ icon: Icon, message, className }: EmptyStateProps) => (
    <div className={cn("flex flex-col items-center justify-center h-full text-muted-foreground", className)}>
        <Icon
            className="size-8 mb-2 opacity-30"
        />
        <p className="text-sm">
            {message}
        </p>
    </div>
);
