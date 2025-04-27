import {Avatar, AvatarFallback, AvatarImage} from "@/lib/components/ui/avatar";


const users = [
    {
        id: "1",
        name: "Olivia Martin",
        email: "olivia.martin@email.com",
        lastActive: "Just now",
        status: "active",
    },
    {
        id: "2",
        name: "Jackson Lee",
        email: "jackson.lee@email.com",
        lastActive: "10 minutes ago",
        status: "active",
    },
    {
        id: "3",
        name: "Isabella Nguyen",
        email: "isabella.nguyen@email.com",
        lastActive: "1 hour ago",
        status: "active",
    },
    {
        id: "4",
        name: "William Kim",
        email: "william.kim@email.com",
        lastActive: "3 hours ago",
        status: "inactive",
    },
    {
        id: "5",
        name: "Sofia Davis",
        email: "sofia.davis@email.com",
        lastActive: "1 day ago",
        status: "active",
    },
]


export function RecentUsers() {
    return (
        <div className="space-y-8">
            {users.map((user) => (
                <div key={user.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`/placeholder.svg?height=36&width=36`} alt={user.name}/>
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto text-sm">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-gray-300"}`}/>
                            <span>{user.lastActive}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
