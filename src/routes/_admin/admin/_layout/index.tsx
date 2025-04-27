import {queryOptions} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Overview} from "@/lib//components/admin/dashboard/Overview";
import {UserStats} from "@/lib/components/admin/dashboard/UserStats";
import {RecentUsers} from "@/lib/components/admin/dashboard/RecentUsers";
import {DashboardShell} from "@/lib/components/admin/dashboard/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/dashboard/DashboardHeader";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


const userAdminOptions = () => queryOptions({
    queryKey: ["adminOverview"],
    queryFn: () => getAdminOverview(),
});


export const Route = createFileRoute("/_admin/admin/_layout/")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(userAdminOptions());
    },
    component: DashboardPage,
})


export default function DashboardPage() {
    return (
        <DashboardShell>
            <DashboardHeader heading="Dashboard" description="Overview of your platform's performance and user statistics."/>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <UserStats
                    icon="users"
                    value="10,482"
                    title="Total Users"
                    description="+12% from last month"
                />
                <UserStats title="Active Users" value="8,641" description="+5.2% from last week" icon="activity"/>
                <UserStats title="New Users" value="1,245" description="+18% from last month" icon="userPlus"/>
                <UserStats title="Privacy Restricted" value="2,431" description="23% of total users" icon="shield"/>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>Cumulative number of users per month</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview/>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Latest user activity on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentUsers/>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
