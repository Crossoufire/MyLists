import {type LucideIcon} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface UserStatsProps {
    title: string;
    icon: LucideIcon;
    description: string;
    value: string | number;
}


export function UserStats({ title, value, description, icon }: UserStatsProps) {
    const Icon = icon;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-medium">{title}</CardTitle>
                <Icon className="size-5 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
