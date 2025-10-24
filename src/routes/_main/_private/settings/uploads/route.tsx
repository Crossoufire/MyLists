import {toast} from "sonner";
import {JobProgress} from "@/lib/types/tasks.types";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {queryOptions, useMutation, useSuspenseQuery} from "@tanstack/react-query";
import {cancelUserUpload, getUserUploads} from "@/lib/server/functions/user-settings";
import {Badge} from "@/lib/client/components/ui/badge";


const uploadsOptions = queryOptions({
    queryKey: ["uploads"],
    queryFn: getUserUploads,
    refetchInterval: (query) => {
        const data = query.state.data;
        if (!data || data.length === 0) return false;
        if (data.some((job) => job.status === "active")) {
            return 3000;
        }
        return false;
    },
});


const useCancelUploadsMutation = () => {
    return useMutation({
        mutationFn: cancelUserUpload,
        onMutate: async (variables, context) => {
            await context.client.cancelQueries({ queryKey: uploadsOptions.queryKey });

            const jobId = variables.data.jobId;
            const previousUploads = context.client.getQueryData(uploadsOptions.queryKey);

            context.client.setQueryData(uploadsOptions.queryKey, (oldData) => {
                if (!oldData) return;
                return oldData.map((job) =>
                    job.id === jobId ? { ...job, status: "completed", returnValue: { result: "cancelled" } } : job
                );
            });

            return { previousUploads };
        },
        onError: (error, _variables, onMutateResult, context) => {
            toast.error(error.message);
            context.client.setQueryData(uploadsOptions.queryKey, onMutateResult?.previousUploads);
        },
    });
}


type UserJob = Awaited<ReturnType<typeof getUserUploads>>[number];


export const Route = createFileRoute("/_main/_private/settings/uploads")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(uploadsOptions);
    },
    component: UserUploadsPage,
});


function UserUploadsPage() {
    const apiData = useSuspenseQuery(uploadsOptions).data;
    const orderedJobs = apiData.sort((a, b) => b.timestamp - a.timestamp);

    return (
        <PageTitle title="Your Uploads" subtitle="View and manage your CSV uploads.">
            <div className="space-y-6 mt-4">
                {apiData.length === 0 ?
                    <MutedText>No uploads found</MutedText>
                    :
                    <div>
                        <div className="flex flex-col gap-4 pr-3 max-w-[600px] max-h-[500px] overflow-y-auto">
                            {orderedJobs.map((job) =>
                                <JobStatus
                                    job={job}
                                    key={job.id}
                                />
                            )}
                        </div>
                    </div>
                }
            </div>
        </PageTitle>
    );
}


const JobStatus = ({ job }: { job: UserJob }) => {
    const cancelUploadsMutation = useCancelUploadsMutation();
    const jobStatus = job.returnValue?.result === "cancelled" ? "cancelled" : job.status;

    const handleCancel = () => {
        cancelUploadsMutation.mutate({ data: { jobId: job.id! } }, {
            onSuccess: () => toast.success("Upload cancelled successfully"),
        });
    }

    const getProgress = () => {
        if (job.status !== "active" || !job.progress) {
            return { percentage: 0, message: "" };
        }

        const progress = job.progress as JobProgress;
        return {
            message: progress.message,
            percentage: progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
        };
    };

    const getJobStatusColor = (jobStatus: string) => {
        switch (jobStatus) {
            case "active":
                return "bg-blue-900";
            case "waiting":
                return "bg-yellow-900";
            case "completed":
                return "bg-green-900";
            case "failed":
                return "bg-red-900";
            case "cancelled":
                return "bg-gray-700";
        }
    };

    const progress = getProgress();

    return (
        <div className="p-3 border rounded-lg">
            <div className="flex justify-between">
                <div>
                    <div className="font-medium">
                        Uploaded '{job.data.fileName}'
                    </div>
                    <div className="text-gray-400 text-sm">
                        {formatDateTime(job.timestamp / 1000)}
                    </div>
                </div>
                <div>
                    {jobStatus === "active" ?
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelUploadsMutation.isPending}
                        >
                            {cancelUploadsMutation.isPending ? "Cancelling..." : "Cancel"}
                        </Button>
                        :
                        <Badge className={`${getJobStatusColor(jobStatus)} text-white font-medium px-3 py-1`}>
                            {capitalize(jobStatus)}
                        </Badge>
                    }
                </div>
            </div>

            {job.status === "active" &&
                <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                        <span className="truncate">{progress.message}</span>
                        <span>{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            style={{ width: `${progress.percentage}%` }}
                            className="bg-blue-500 h-2 rounded-full transition-all"
                        />
                    </div>
                </div>
            }

            {job.status === "failed" &&
                <div className="mt-2 text-red-700 truncate">
                    <strong>Failed</strong> - Sorry the job failed. Please try again later.
                </div>
            }
        </div>
    );
};
