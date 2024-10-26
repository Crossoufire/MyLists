import {MediaType} from "@/utils/types";
import {UserMediaDetails} from "@/components/media-user/UserMediaDetails";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle} from "@/components/ui/credenza";


interface UserMediaEditDialogProps {
    userMedia: {
        comment: string;
        media_id: number;
        favorite: boolean;
        media_name: string;
        labels?: Array<any>;
    };
    queryKey: Array<any>;
    mediaType: MediaType;
    onOpenChange: (open: boolean) => void;
}


export const UserMediaEditDialog = ({userMedia, mediaType, queryKey, onOpenChange}: UserMediaEditDialogProps) => {
    if (!userMedia) return null;

    return (
        <Credenza defaultOpen={true} onOpenChange={onOpenChange}>
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