import {ListUserMedia} from "@/lib/components/types";
import {MediaType} from "@/lib/server/utils/enums";
import {UserMediaDetails} from "@/lib/components/user-media/base/UserMediaDetails";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle} from "@/lib/components/ui/credenza";


interface UserMediaEditDialogProps {
    queryKey: string[];
    dialogOpen: boolean;
    mediaType: MediaType;
    userMedia: ListUserMedia;
    onOpenChange: (open: boolean) => void;
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