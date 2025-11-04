import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {ErrorLogCard} from "@/lib/client/components/admin/ErrorLogCard";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {adminErrorLogsOptions} from "@/lib/client/react-query/query-options/admin-options";


export const Route = createFileRoute("/_admin/admin/error-logs")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(adminErrorLogsOptions),
    component: AdminErrorLogsPage,
})


function AdminErrorLogsPage() {
    const errorLogs = useSuspenseQuery(adminErrorLogsOptions).data;

    return (
        <DashboardShell>
            <DashboardHeader heading="Error Logs" description="View and manage system error logs."/>
            <div>
                {errorLogs.length === 0 ?
                    <p className="text-center text-muted-foreground p-8">
                        No error logs yet.
                    </p>
                    :
                    <div className="space-y-4">
                        {errorLogs.map((errorLog) =>
                            <ErrorLogCard
                                key={errorLog.id}
                                errorLog={errorLog}
                            />
                        )}
                    </div>
                }
            </div>
        </DashboardShell>
    );
}
