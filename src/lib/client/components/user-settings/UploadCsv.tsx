import {toast} from "sonner";
import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {Link, useNavigate} from "@tanstack/react-router";
import {Label} from "@/lib/client/components/ui/label";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";
import {postUploadsCsvFile} from "@/lib/server/functions/user-settings";


const useUploadCsvMutation = () => {
    return useMutation({
        mutationFn: postUploadsCsvFile,
        onError: (error) => toast.error(error.message || "An error occurred while uploading the CSV."),
        onSuccess: () => toast.success("CSV uploaded successfully"),
    });
}


export const UploadCsv = () => {
    const navigate = useNavigate();
    const uploadMutation = useUploadCsvMutation();
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        uploadMutation.mutate({ data: formData }, {
            onSuccess: async () => {
                setFile(null);

                await navigate({ to: "/settings/uploads" });
            },
        });
    };

    return (
        <>
            <div>
                <div className="space-y-2 text-base">
                    <div>See all my uploads and progression</div>
                    <div>
                        <Link to="/settings/uploads" className="text-sm underline">
                            <Button variant="outline" size="sm">
                                My Uploads
                            </Button>
                        </Link>
                    </div>
                </div>
                <Separator className="my-6"/>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label>Select a CSV file</Label>
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
            </div>
        </>
    );
};
