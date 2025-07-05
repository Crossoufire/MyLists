import {cn} from "@/lib/utils/helpers";


interface StatsCardProps {
    color: string;
    label: string;
    value: number | string;
    icon: React.ElementType;
}


export const StatsCard = ({ icon: Icon, label, value, color }: StatsCardProps) => {
    return (
        <div className="rounded-lg border bg-primary/10 p-3">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("w-5 h-5", color)}/>
                <p className="font-medium">{label}</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
    );
};
