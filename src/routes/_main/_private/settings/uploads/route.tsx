// import {toast} from "sonner";
import {createFileRoute} from "@tanstack/react-router";
// import {JobCard} from "@/lib/client/components/admin/JobCard";
// import {PageTitle} from "@/lib/client/components/general/PageTitle";
// import {MutedText} from "@/lib/client/components/general/MutedText";
// import {queryOptions, useMutation, useSuspenseQuery} from "@tanstack/react-query";
// import {cancelUserUpload, getUserUploads} from "@/lib/server/functions/user-settings";
// import {adminCheckActiveJobs} from "@/lib/client/react-query/query-options/admin-options";


// const uploadsOptions = (pollingSec = 3) => queryOptions({
//     queryKey: ["uploads"],
//     queryFn: getUserUploads,
//     refetchInterval: (query) => {
//         const data = query.state.data;
//         if (!data || data.length === 0) return false;
//         if (data.some((job) => job.status === "active" || job.status === "waiting")) {
//             return pollingSec * 1000;
//         }
//         return false;
//     },
// });


// type QKeyCancelUploads = ReturnType<typeof uploadsOptions>["queryKey"] | ReturnType<typeof adminCheckActiveJobs>["queryKey"];


// export const useCancelUploadsMutation = (queryKey: QKeyCancelUploads) => {
//     return useMutation({
//         mutationFn: cancelUserUpload,
//         onMutate: async (variables, context) => {
//             await context.client.cancelQueries({ queryKey });
//
//             const jobId = variables.data.jobId;
//             const previousUploads = context.client.getQueryData(queryKey);
//
//             context.client.setQueryData(queryKey, (oldData) => {
//                 if (!oldData) return;
//                 return oldData.map((job) =>
//                     job.jobId === jobId ? { ...job, status: "completed", returnValue: { result: "cancelled" } } : job
//                 );
//             });
//
//             return { previousUploads };
//         },
//         onError: (error, _variables, onMutateResult, context) => {
//             toast.error(error.message);
//             context.client.setQueryData(queryKey, onMutateResult?.previousUploads);
//         },
//     });
// }
//


export const Route = createFileRoute("/_main/_private/settings/uploads")({
    component: () => <></>,
});


// function UserUploadsPage() {
//     const userJobs = useSuspenseQuery(uploadsOptions()).data;
//
//     return (
//         <PageTitle title="Your Uploads" subtitle="View and manage your CSV uploads.">
//             <div className="space-y-6 mt-4">
//                 {userJobs.length === 0 ?
//                     <MutedText>No uploads found</MutedText>
//                     :
//                     <div>
//                         <div className="flex flex-col gap-4 pr-3 max-w-[600px] max-h-[500px] overflow-y-auto">
//                             {userJobs.map((job) =>
//                                 <JobCard
//                                     job={job}
//                                     key={job.jobId}
//                                     isAdmin={false}
//                                     queryKey={uploadsOptions().queryKey}
//                                     title={`Upload: ${job.data.fileName}`}
//                                 />
//                             )}
//                         </div>
//                     </div>
//                 }
//             </div>
//         </PageTitle>
//     );
// }
