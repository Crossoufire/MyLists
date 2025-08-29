import {MediaType} from "@/lib/server/utils/enums";
import {UserMediaItem} from "@/lib/types/query.options.types";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {UserMediaDetails} from "@/lib/components/media/base/UserMediaDetails";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle} from "@/lib/components/ui/credenza";


interface UserMediaEditDialogProps {
    dialogOpen: boolean;
    mediaType: MediaType;
    userMedia: UserMediaItem;
    onOpenChange: (open: boolean) => void;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
}


export const UserMediaEditDialog = ({ dialogOpen, userMedia, mediaType, queryKey, onOpenChange }: UserMediaEditDialogProps) => {
    if (!userMedia) return null;

    return (
        <Credenza open={dialogOpen} onOpenChange={onOpenChange}>
            <CredenzaContent>
                <CredenzaHeader className="mb-4">
                    <CredenzaTitle>{userMedia.mediaName}</CredenzaTitle>
                    <CredenzaDescription>Here you can edit your media details</CredenzaDescription>
                </CredenzaHeader>
                <div className="flex items-center justify-center">
                    <UserMediaDetails
                        queryKey={queryKey}
                        userMedia={userMedia}
                        mediaType={mediaType}
                    />
                </div>
            </CredenzaContent>
        </Credenza>
    );
};