import {capitalize} from "@/lib/utils/functions";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Activity, Shield, UserPlus, Users} from "lucide-react";
import {UserStats} from "@/lib/client/components/admin/UserStats";
import {RecentUsers} from "@/lib/client/components/admin/RecentUsers";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {adminOverviewOptions} from "@/lib/client/react-query/query-options/admin-options";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


export const Route = createFileRoute("/_admin/admin/dashboard")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminOverviewOptions()),
    component: DashboardPage,
});


function DashboardPage() {
    const apiData = useSuspenseQuery(adminOverviewOptions()).data;
    const newUsers = apiData.newUsers.comparedToLastMonth > 0;

    return (
        <DashboardShell>
            <DashboardHeader
                heading="Users Overview"
                description="Overview of the user statistics and growth of MyLists."
            />
            <div className="grid gap-4 grid-cols-5 max-sm:grid-cols-2 max-sm:gap-3">
                <UserStats
                    icon={Users}
                    title="Total Users"
                    value={apiData.totalUsers.count}
                    description="Users that registered"
                />
                <UserStats
                    icon={UserPlus}
                    title="New Users"
                    value={apiData.newUsers.count}
                    description={`${newUsers ? "+" : ""}${apiData.newUsers.comparedToLastMonth} compared to last month`}
                />
                <UserStats
                    icon={Activity}
                    title="Active Users"
                    description="Users seen this month"
                    value={apiData.usersSeenThisMonth.count}
                />
                {apiData.usersPerPrivacy.map((privacyValue, idx) =>
                    <UserStats
                        key={idx}
                        icon={Shield}
                        value={privacyValue.count}
                        title={capitalize(privacyValue.privacy) + " Users"}
                        description={"Users with privacy set to " + privacyValue.privacy}
                    />
                )}
                <Card className="col-span-3 max-sm:col-span-2">
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
                <Card className="col-span-2 max-sm:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>Latest user activity on MyLists</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-3">
                        <RecentUsers users={apiData.recentUsers}/>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
