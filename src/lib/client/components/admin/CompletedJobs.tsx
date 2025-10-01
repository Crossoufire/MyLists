import {Loader2} from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {JobCard} from "@/lib/client/components/admin/JobCard";
import {adminJobCompletedOptions} from "@/lib/client/react-query/query-options/admin-options";


export function CompletedJobs() {
    const { data: completedData = [], isLoading, error } = useQuery(adminJobCompletedOptions());

    return (
        <>
            {isLoading &&
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                    <span className="ml-2">Loading completed jobs...</span>
                </div>
            }
            {error && <div>Could not load completed jobs: {error.message}</div>}
            {!isLoading && !error && completedData.length === 0 &&
                <p className="text-center text-muted-foreground p-8">
                    No tasks are completed found yet.
                </p>
            }
            {!isLoading && !error && completedData.length > 0 &&
                <div className="space-y-4">
                    {completedData.sort((a, b) => {
                        const finishedA = a.finishedOn ?? Number.MIN_SAFE_INTEGER;
                        const finishedB = b.finishedOn ?? Number.MIN_SAFE_INTEGER;
                        return finishedB - finishedA;
                    }).map((job) =>
                        <JobCard
                            job={job}
                            key={job.id}
                        />
                    )}
                </div>
            }
        </>
    )
}