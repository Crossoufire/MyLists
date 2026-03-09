import {Award, ChartNoAxesColumn, EllipsisVertical, ListOrdered, Plus, User} from "lucide-react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute, Link} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {CollectionCard} from "@/lib/client/components/collections/CollectionCard";
import {userCollectionsOptions} from "@/lib/client/react-query/query-options/query-options";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";


export const Route = createFileRoute("/_main/_private/collections/user/$username")({
    loader: ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(userCollectionsOptions(username));
    },
    component: UserCollectionsPage,
});


function UserCollectionsPage() {
    const { currentUser } = useAuth();
    const { username } = Route.useParams();
    const isOwner = currentUser?.name === username;
    const collections = useSuspenseQuery(userCollectionsOptions(username)).data;

    return (
        <PageTitle
            title={`${username} Collections`}
            subtitle={isOwner ? "Manage every collection in one place." : `Collections created by ${username}.`}
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b">
                    {isOwner &&
                        <Button size="sm" variant="outline" className="mb-2" asChild>
                            <Route.Link to="/collections/create">
                                <Plus className="size-4"/> New collection
                            </Route.Link>
                        </Button>
                    }
                    <div>
                        <DotsOthers
                            username={username}
                        />
                    </div>
                </div>
                {collections.length === 0 ?
                    <EmptyState
                        className="py-20"
                        icon={ListOrdered}
                        message={isOwner ? "You have not created any collections yet." : "No collections yet."}
                    />
                    :
                    <div className="grid gap-4 gap-y-7 grid-cols-3 max-sm:grid-cols-1">
                        {collections.map((collection) =>
                            <CollectionCard
                                showOwner={false}
                                key={collection.id}
                                collection={collection}
                            />
                        )}
                    </div>
                }
            </div>
        </PageTitle>
    );
}


const DotsOthers = ({ username }: { username: string }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="opacity-70 hover:opacity-100">
                <EllipsisVertical className="size-4"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-46">
                <DropdownMenuItem asChild>
                    <Link to="/stats/$username" params={{ username }}>
                        <ChartNoAxesColumn className="size-4 text-muted-foreground"/>
                        <span>User's Stats</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/profile/$username" params={{ username }}>
                        <User className="size-4 text-muted-foreground"/>
                        <span>User's Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/collections/user/$username" params={{ username }}>
                        <ListOrdered className="size-4 text-muted-foreground"/>
                        <span>User's Collections</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/achievements/$username" params={{ username }}>
                        <Award className="size-4 text-muted-foreground"/>
                        <span>User's Achievements</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
