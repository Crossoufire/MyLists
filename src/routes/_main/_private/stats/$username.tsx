import {MediaType} from "@/lib/utils/enums";
import {TabValue} from "@/lib/types/stats.types";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Award, EllipsisVertical, LayoutGrid, User} from "lucide-react";
import {DashboardContent} from "@/lib/client/media-stats/DashboardContent";
import {TabHeader, TabItem} from "@/lib/client/components/user-profile/TabHeader";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {userStatsOptions} from "@/lib/client/react-query/query-options/query-options";
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/lib/client/components/ui/dropdown-menu";


export const Route = createFileRoute("/_main/_private/stats/$username")({
    validateSearch: (search) => search as { mediaType?: MediaType },
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(userStatsOptions(username, search));
    },
    component: UserStatsPage,
});


function UserStatsPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { username } = Route.useParams();
    const selectedTab: TabValue = filters?.mediaType ?? "overview";
    const apiData = useSuspenseQuery(userStatsOptions(username, filters)).data;

    const handleTabChange = async (value: string) => {
        await navigate({ search: value === "overview" ? undefined : { mediaType: value as MediaType } });
    };

    const mediaTabs: TabItem<"overview" | MediaType>[] = [
        {
            id: "overview",
            isAccent: true,
            label: "Overview",
            icon: <LayoutGrid size={15}/>,
        },
        ...apiData.activatedMediaTypes.map((mediaType) => ({
            id: mediaType,
            label: mediaType,
            icon: <MediaAndUserIcon size={15} type={mediaType}/>,
        })),
    ];

    return (
        <PageTitle title={`${username} Statistics`} subtitle="Comprehensive media tracking insights">
            <div className="mb-6">
                <TabHeader tabs={mediaTabs} activeTab={selectedTab} setActiveTab={handleTabChange}>
                    <QuickActions
                        username={username}
                    />
                </TabHeader>
            </div>

            <DashboardContent
                data={apiData}
                selectedTab={selectedTab}
            />
        </PageTitle>
    );
}


const QuickActions = ({ username }: { username: string }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="opacity-70 hover:opacity-100">
                <EllipsisVertical className="size-4"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <Link to="/profile/$username" params={{ username }}>
                    <DropdownMenuItem className="cursor-pointer">
                        <User className="size-4 text-muted-foreground"/>
                        <span>User's Profile</span>
                    </DropdownMenuItem>
                </Link>
                <Link to="/achievements/$username" params={{ username }}>
                    <DropdownMenuItem className="cursor-pointer">
                        <Award className="size-4 text-muted-foreground"/>
                        <span>Achievements</span>
                    </DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
