import {Activity, type LucideIcon, Shield, UserPlus, Users} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface UserStatsProps {
    title: string
    value: string
    description: string
    icon: "users" | "activity" | "userPlus" | "shield"
}


export function UserStats({ title, value, description, icon }: UserStatsProps) {
    const icons: Record<string, LucideIcon> = {
        users: Users,
        shield: Shield,
        activity: Activity,
        userPlus: UserPlus,
    }

    const Icon = icons[icon]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
