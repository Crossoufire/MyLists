import {capitalize} from "@/lib/utils/functions";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {UserStats} from "@/lib/components/admin/UserStats";
import {RecentUsers} from "@/lib/components/admin/RecentUsers";
import {DashboardShell} from "@/lib/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/DashboardHeader";
import {adminOverviewOptions} from "@/lib/react-query/query-options/admin-options";
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


export const Route = createFileRoute("/_admin/admin/_layout/dashboard")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminOverviewOptions()),
    component: DashboardPage,
});


export default function DashboardPage() {
    const apiData = useSuspenseQuery(adminOverviewOptions()).data;

    return (
        <DashboardShell>
            <DashboardHeader
                heading="Dashboard"
                description="Overview of your platform's performance and user statistics."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <UserStats
                    icon="users"
                    title="Total Users"
                    value={apiData.totalUsers.count}
                    description={`+${apiData.totalUsers.growth.toFixed(1)}% from last month`}
                />
                <UserStats
                    icon="activity"
                    title="Active Users"
                    value={apiData.activeUsers.count}
                    description={`+${apiData.activeUsers.growth.toFixed(1)}% from last month`}
                />
                {apiData.usersPerPrivacy.map((privacyValue, idx) =>
                    <UserStats
                        key={idx}
                        icon="shield"
                        value={privacyValue.count}
                        title={capitalize(privacyValue.privacy) + " Users"}
                        description={"Users with privacy set to " + privacyValue.privacy}
                    />
                )}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>Cumulative number of users per month</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-3">
                        <ResponsiveContainer width="100%" height={350} className="-ml-4">
                            <BarChart data={apiData.cumulativeUsersPerMonth}>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
                                <Tooltip contentStyle={{ backgroundColor: "#111827", color: "#fff", border: "none", borderRadius: "8px" }}/>
                                <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Latest user activity on the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-3">
                        <RecentUsers users={apiData.recentUsers}/>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
