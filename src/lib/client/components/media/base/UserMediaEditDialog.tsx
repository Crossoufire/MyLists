import {MediaType} from "@/lib/utils/enums";
import {useQueryClient} from "@tanstack/react-query";
import {UserMediaItem} from "@/lib/types/query.options.types";
import {mediaListOptions} from "@/lib/client/react-query/query-options";
import {UserMediaDetails} from "@/lib/client/components/media/base/UserMediaDetails";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


interface UserMediaEditDialogProps {
    dialogOpen: boolean;
    mediaType: MediaType;
    userMedia: UserMediaItem;
    onOpenChange: (open: boolean) => void;
    queryOption: ReturnType<typeof mediaListOptions>;
}


export const UserMediaEditDialog = ({ dialogOpen, userMedia, mediaType, queryOption, onOpenChange }: UserMediaEditDialogProps) => {
    const queryClient = useQueryClient();
    if (!userMedia) return null;

    const onDialogOpenChange = async (open: boolean) => {
        onOpenChange(open);
        if (open) return;

        // A save outlive the dialog. Refresh only once those edits have settled
        const mutationCache = queryClient.getMutationCache();
        const pendingEdits = mutationCache.findAll({ mutationKey: ["userMediaEdit", mediaType], status: "pending" });
        if (pendingEdits.length > 0) {
            await new Promise<void>((resolve) => {
                const unsubscribe = mutationCache.subscribe(() => {
                    if (pendingEdits.every((mutation) => mutation.state.status !== "pending")) {
                        unsubscribe();
                        resolve();
                    }
                });
            });
        }

        await queryClient.invalidateQueries({ queryKey: ["userList", mediaType, queryOption.queryKey[2]] });
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
            <DialogContent className="w-108 max-sm:w-full">
                <DialogHeader>
                    <DialogTitle>
                        {userMedia.mediaName}
                    </DialogTitle>
                    <DialogDescription>
                        Here you can edit your media details
                    </DialogDescription>
                </DialogHeader>
                <div className="w-full flex items-center justify-center max-sm:mb-8 max-sm:px-2">
                    <UserMediaDetails
                        userMedia={userMedia}
                        mediaType={mediaType}
                        queryOption={queryOption}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
