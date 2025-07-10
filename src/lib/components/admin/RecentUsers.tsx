import {Link} from "@tanstack/react-router";
import {formatDateTime} from "@/lib/utils/functions";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/components/ui/avatar";


export function RecentUsers({ users }: { users: any[] }) {
    return (
        <div className="space-y-8 overflow-y-auto max-h-90 pr-4">
            {users.map((user) =>
                <div key={user.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image} alt={user.name}/>
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            <Link to={`/profile/$username`} params={{ username: user.name }} className="hover:underline hover:underline-offset-2">
                                {user.name}
                            </Link>
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto text-sm">
                        <div className="flex items-center gap-2">
                            <span>{formatDateTime(user.updatedAt, { includeTime: true })}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
