import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/formating";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {TabHeader} from "@/lib/client/components/general/TabHeader";
import {MediaLevel} from "@/lib/client/components/general/MediaLevel";
import {createFileRoute, Link, Outlet, useLocation} from "@tanstack/react-router";
import {userListHeaderOption} from "@/lib/client/react-query/query-options/query-options";
import {Award, ChartLine, ChartNoAxesColumn, EllipsisVertical, Layers, Library, User} from "lucide-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";


export const Route = createFileRoute("/_main/_private/list/$mediaType/$username/_header")({
    params: {
        parse: (params) => {
            return {
                username: params.username,
                mediaType: params.mediaType as MediaType,
            }
        }
    },
    loader: async ({ context: { queryClient }, params: { mediaType, username } }) => {
        return queryClient.ensureQueryData(userListHeaderOption(mediaType, username));
    },
    component: ListHeader,
});


function ListHeader() {
    const location = useLocation();
    const navigate = Route.useNavigate();
    const { username, mediaType } = Route.useParams();
    const { timeSpent } = useSuspenseQuery(userListHeaderOption(mediaType, username)).data;

    const activeTab = location.pathname.endsWith("/collections")
        ? "collections" : location.pathname.endsWith("/stats")
            ? "stats" : location.pathname.endsWith("/achievements")
                ? "achievements" : "list";

    const onTabChange = (tabName: string) => {
        if (tabName === activeTab) return;
        if (tabName === "list") {
            return navigate({ to: `/list/${mediaType}/${username}` });
        }
        if (tabName === "collections") {
            return navigate({ to: `/list/${mediaType}/${username}/collections` });
        }
        if (tabName === "stats") {
            return navigate({ to: `/list/${mediaType}/${username}/stats` });
        }
        return navigate({ to: `/list/${mediaType}/${username}/achievements` });
    };

    const tabs = [
        {
            id: "list",
            label: "List",
            isAccent: true,
            icon: <Library className="size-4"/>,
        }, {
            isAccent: true,
            id: "collections",
            label: "Collections",
            icon: <Layers className="size-4"/>,
        }, {
            id: "stats",
            label: "stats",
            isAccent: true,
            icon: <ChartNoAxesColumn className="size-4"/>,
        }, {
            isAccent: true,
            id: "achievements",
            label: "achievements",
            icon: <Award className="size-4"/>,
        },
    ]

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} ${capitalize(activeTab)}`} onlyHelmet>
            <div className="pt-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <MediaLevel
                            className="text-2xl"
                            mediaType={mediaType}
                            timeSpentMin={timeSpent}
                            containerClassName="pt-1"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight capitalize">
                            {mediaType} {activeTab}
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="size-3"/> {username}
                        </p>
                    </div>
                </div>
                <div className="pt-4">
                    <TabHeader
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={(tabName) => onTabChange(tabName)}
                    >
                        <DotsOthers
                            username={username}
                            mediaType={mediaType}
                        />
                    </TabHeader>
                </div>
            </div>
            <div className="pt-4">
                <Outlet/>
            </div>
        </PageTitle>
    );
}


const DotsOthers = ({ mediaType, username }: { mediaType: MediaType; username: string }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <EllipsisVertical className="size-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                    <Link to="/profile/$username" params={{ username }}>
                        <User className="size-4 text-muted-foreground"/>
                        <span>User's Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/stats/$username" params={{ username }} search={{ mediaType }}>
                        <ChartLine className="size-4 text-muted-foreground"/>
                        <span>Collection Stats</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/achievements/$username" params={{ username }}>
                        <Award className="size-4 text-muted-foreground"/>
                        <span>Achievements</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
