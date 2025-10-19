import {toast} from "sonner";
import {useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {useMutation, useQuery} from "@tanstack/react-query";
import {getProgressOnCsvFile, postProcessCsvFile} from "@/lib/server/functions/user-settings";


export const UploadCSV = () => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | undefined | null>(null);

    const uploadMutation = useMutation({
        mutationFn: postProcessCsvFile,
        onError: () => toast.error("Failed to upload CSV"),
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

    const progress = (data?.progress && typeof data.progress === "object") ?
        JSON.stringify(data.progress) : `Progress: ${data?.progress ?? 0}%`;

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!file) {
            toast.error("Please select a file");
            return;
        }
        uploadMutation.mutate({ data: { file } });
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
            </form>
            {!!jobId &&
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            style={{ width: `${progress}%` }}
                            className="bg-blue-500 h-2 rounded-full transition-all"
                        />
                    </div>
                </div>
            }
        </>
    );
};
