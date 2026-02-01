import {getMonthName} from "@/lib/utils/formating";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {createFileRoute, Outlet, useLocation, useSearch} from "@tanstack/react-router";


export const Route = createFileRoute("/_main/_private/stats/$username/_header")({
    component: StatsHeader,
});


function StatsHeader() {
    const location = useLocation();
    const { username } = Route.useParams();
    const filters = useSearch({ strict: false });

    const title = location.pathname.endsWith("/activity")
        ? `${getMonthName(filters.month ?? String(new Date().getMonth() + 1))} Activity`
        : `${username} Statistics`;

    const subtitle = location.pathname.endsWith("/activity")
        ? `${username} activity for ${filters.year ?? new Date().getFullYear()}`
        : "Comprehensive media tracking insights";

    return (
        <PageTitle title={title} subtitle={subtitle}>
            <Outlet/>
        </PageTitle>
    );
}
