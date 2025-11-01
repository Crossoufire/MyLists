// import {toast} from "sonner";
// import {useState} from "react";
// import {useMutation} from "@tanstack/react-query";
// import {Label} from "@/lib/client/components/ui/label";
// import {Input} from "@/lib/client/components/ui/input";
// import {useNavigate} from "@tanstack/react-router";
// import {Button} from "@/lib/client/components/ui/button";
// import {postUploadsCsvFile} from "@/lib/server/functions/user-settings";
//
//
// const useUploadCsvMutation = () => {
//     return useMutation({
//         mutationFn: postUploadsCsvFile,
//         onError: (err) => toast.error(err.message || "An error occurred while uploading the CSV."),
//         onSuccess: () => toast.success("CSV uploaded successfully"),
//     });
// }
//
//
// export const UploadCsv = () => {
//     const navigate = useNavigate();
//     const uploadMutation = useUploadCsvMutation();
//     const [file, setFile] = useState<File | null>(null);
//
//     const handleSubmit = (ev: React.FormEvent) => {
//         ev.preventDefault();
//         if (!file) {
//             toast.error("Please select a file");
//             return;
//         }
//
//         const formData = new FormData();
//         formData.append("file", file);
//
//         uploadMutation.mutate({ data: formData }, {
//             onSuccess: async (data) => {
//                 setFile(null);
//                 await navigate({ to: "/settings/uploads/$taskId", params: { taskId: data.taskId } });
//             },
//         });
//     };
//
//     return (
//         <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
//             <div className="space-y-2">
//                 <Label>Select a CSV file</Label>
//                 <Input
//                     type="file"
//                     accept=".csv"
//                     disabled={uploadMutation.isPending}
//                     onChange={(e) => setFile(e.target.files?.[0] || null)}
//                 />
//             </div>
//             <Button type="submit" disabled={!file || uploadMutation.isPending}>
//                 Upload Movies CSV
//             </Button>
//         </form>
//     );
// };
