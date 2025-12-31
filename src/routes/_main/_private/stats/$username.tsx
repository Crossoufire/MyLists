import {MediaType} from "@/lib/utils/enums";
import {TabValue} from "@/lib/types/stats.types";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {Award, EllipsisVertical, User} from "lucide-react";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {DashboardContent} from "@/lib/client/media-stats/DashboardContent";
import {userStatsOptions} from "@/lib/client/react-query/query-options/query-options";
import {TabHeader} from "@/lib/client/components/user-profile/TabHeader";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";


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

    return (
        <PageTitle title={`${username} Statistics`} subtitle="Comprehensive media tracking insights">
            <div className="mt-4 mb-8">
                <TabHeader
                    activeTab={selectedTab}
                    setActiveTab={handleTabChange}
                    mediaTypes={apiData.activatedMediaTypes}
                />
            </div>

            <QuickActions username={username}/>

            <DashboardContent
                data={apiData}
                selectedTab={selectedTab}
            />
        </PageTitle>
    );
}


export function QuickActions({ username }: { username: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                    <EllipsisVertical className="size-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-42 p-2">
                <Link to="/profile/$username" params={{ username }}>
                    <Button variant="ghost" className="w-full inline-flex items-center justify-start">
                        <User className="size-4 text-muted-foreground"/>
                        User's Profile
                    </Button>
                </Link>
                <Link to="/achievements/$username" params={{ username }}>
                    <Button variant="ghost" className="w-full inline-flex items-center justify-start">
                        <Award className="size-4 text-muted-foreground"/>
                        Achievements
                    </Button>
                </Link>
            </PopoverContent>
        </Popover>
    );
}
