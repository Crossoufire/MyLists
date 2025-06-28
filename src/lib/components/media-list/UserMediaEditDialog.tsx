import {MediaType} from "@/lib/server/utils/enums";
import {UserMediaDetails} from "@/lib/components/user-media/base/UserMediaDetails";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle} from "@/lib/components/ui/credenza";


interface UserMediaEditDialogProps {
    userMedia: any;
    queryKey: string[];
    dialogOpen: boolean;
    mediaType: MediaType;
    onOpenChange: (open: boolean) => void;
}


export const UserMediaEditDialog = ({ dialogOpen, userMedia, mediaType, queryKey, onOpenChange }: UserMediaEditDialogProps) => {
    if (!userMedia) return null;

    return (
        <Credenza open={dialogOpen} onOpenChange={onOpenChange}>
            <CredenzaContent>
                <CredenzaHeader className="mb-4">
                    <CredenzaTitle>{userMedia.media_name}</CredenzaTitle>
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