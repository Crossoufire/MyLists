import {getMonthName} from "@/lib/utils/date-formatting";
import {ActivitySearch} from "@/lib/types/activity.types";
import {createFileRoute, Outlet} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";


export const Route = createFileRoute("/_main/_viewer/activity/$username/_header")({
    validateSearch: (search) => search as ActivitySearch,
    component: ActivityHeader,
});


function ActivityHeader() {
    const { username } = Route.useParams();
    const { year, month } = Route.useSearch();

    return (
        <PageTitle title={`${getMonthName(month)} Activity`} subtitle={`${username} activity for ${year}`}>
            <Outlet/>
        </PageTitle>
    );
}
