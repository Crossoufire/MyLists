import {MediaType} from "@/lib/utils/enums";
import {UserMediaItem} from "@/lib/types/query.options.types";
import {UserMediaDetails} from "@/lib/client/components/media/base/UserMediaDetails";
import {mediaListOptions} from "@/lib/client/react-query/query-options/query-options";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle} from "@/lib/client/components/ui/credenza";


interface UserMediaEditDialogProps {
    dialogOpen: boolean;
    mediaType: MediaType;
    userMedia: UserMediaItem;
    onOpenChange: (open: boolean) => void;
    queryOption: ReturnType<typeof mediaListOptions>;
}


export const UserMediaEditDialog = ({ dialogOpen, userMedia, mediaType, queryOption, onOpenChange }: UserMediaEditDialogProps) => {
    if (!userMedia) return null;

    return (
        <Credenza open={dialogOpen} onOpenChange={onOpenChange}>
            <CredenzaContent className="w-100 max-sm:w-full">
                <CredenzaHeader>
                    <CredenzaTitle>
                        {userMedia.mediaName}
                    </CredenzaTitle>
                    <CredenzaDescription>
                        Here you can edit your media details
                    </CredenzaDescription>
                </CredenzaHeader>
                <div className="w-full max-sm:mb-8">
                    <UserMediaDetails
                        userMedia={userMedia}
                        mediaType={mediaType}
                        queryOption={queryOption}
                    />
                </div>
            </CredenzaContent>
        </Credenza>
    );
};
