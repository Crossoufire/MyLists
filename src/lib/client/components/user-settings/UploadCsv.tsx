import {toast} from "sonner";
import {useState} from "react";
import {JobProgress} from "@/lib/types/tasks.types";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {useMutation, useQuery} from "@tanstack/react-query";
import {getProgressOnCsvFile, postProcessCsvFile} from "@/lib/server/functions/user-settings";


export const UploadCsv = () => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | undefined | null>(null);

    const uploadMutation = useMutation({
        mutationFn: postProcessCsvFile,
        onError: (error) => toast.error(error.message || "An error occurred while uploading the CSV."),
        onSuccess: (data) => {
            setFile(null);
            setJobId(data.jobId)
            toast.success("CSV uploaded successfully");
        },
    });

    const { data } = useQuery({
        queryKey: ["csv-upload", currentUser!.id, jobId],
        queryFn: () => getProgressOnCsvFile({ data: { jobId: jobId! } }),
        refetchInterval: 2000,
        enabled: !!jobId,
    });

    const getProgress = () => {
        if (!data || !data.progress) {
            return {
                total: 0,
                current: 0,
                percentage: 0,
                message: "No progress available",
            };
        }

        const progress = data.progress as JobProgress;

        return {
            total: progress.total,
            current: progress.current,
            message: progress.message,
            percentage: progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
        };
    }

    const progress = getProgress();

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        uploadMutation.mutate({ data: formData });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <Input
                        type="file"
                        accept=".csv"
                        disabled={uploadMutation.isPending}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </div>
                <Button type="submit" disabled={!file || uploadMutation.isPending}>
                    Upload Movies CSV
                </Button>
                {!!jobId &&
                    <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-sm">
                            <span>{progress.message}</span>
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
            </form>
        </>
    );
};
