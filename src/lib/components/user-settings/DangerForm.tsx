import {Button} from "@/lib/components/ui/button";


export const DangerForm = () => {
    // const deleteAccountMutation = useDeleteAccountMutation();

    const onSubmit = async () => {
        const firstConfirm = window.confirm("Are you really sure?");
        if (!firstConfirm) return;

        const secondConfirm = window.confirm("All your data will be permanently deleted. Are you sure?");
        if (!secondConfirm) return;

        // deleteAccountMutation.mutate({}, {
        //     onError: () => toast.error("An error occurred while deleting your account. Please try again later."),
        //     onSuccess: async () => {
        //         logout.mutate(undefined, {
        //             onSuccess: async () => {
        //                 queryClient.clear();
        //                 await router.invalidate().then(() => {
        //                     navigate({ to: "/" });
        //                 });
        //             },
        //         });
        //         toast.success("Your account has been deleted successfully");
        //     }
        // });
    };

    return (
        <div className="space-y-6">
            <div className="max-w-[500px]">
                WARNING: Deleting your account is irreversible and will permanently
                remove all your data and access. Are you sure you want to proceed?
            </div>
            <Button variant="destructive" onClick={onSubmit} className="w-48">
                DELETE MY ACCOUNT
            </Button>
        </div>
    );
};
