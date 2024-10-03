import {UserListDetails} from "@/components/media/general/UserListDetails";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle} from "@/components/ui/credenza";


export const UserMediaEditDialog = ({ userMedia, mediaType, queryKey, onOpenChange }) => {
    if (!userMedia) return null;

    return (
        <Credenza defaultOpen={true} onOpenChange={onOpenChange}>
            <CredenzaContent>
                <CredenzaHeader className="mb-4">
                    <CredenzaTitle>{userMedia.media_name}</CredenzaTitle>
                    <CredenzaDescription>Here you can edit your media details</CredenzaDescription>
                </CredenzaHeader>
                <div className="flex items-center justify-center">
                    <UserListDetails
                        queryKey={queryKey}
                        userMedia={userMedia}
                        mediaType={mediaType}
                    />
                </div>
            </CredenzaContent>
        </Credenza>
    );
};