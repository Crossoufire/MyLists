import {useState} from "react";
import {History} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {HistoryOptionsType} from "@/lib/types/query.options.types";
import {UserUpdate} from "@/lib/client/components/general/UserUpdate";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";
import {useDeleteHistoryUpdatesMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface HistoryDetailsProps {
    mediaId: number;
    mediaType: MediaType;
    history: HistoryOptionsType;
}


export const HistoryDetails = ({ history, mediaId, mediaType }: HistoryDetailsProps) => {
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState<number>();
    const deleteHistoryMutation = useDeleteHistoryUpdatesMutation(mediaType, mediaId);

    const handleDelete = (updateId: number) => {
        setMediaIdBeingDeleted(updateId);
        deleteHistoryMutation.mutate({ data: { updateIds: [updateId] } });
    };

    return (
        <>
            {history.length === 0 ?
                <EmptyState
                    icon={History}
                    className="pt-5"
                    message="No history to display."
                />
                :
                history.map(update =>
                    <UserUpdate
                        key={update.id}
                        update={update}
                        canDelete={true}
                        onDelete={handleDelete}
                        mediaIdBeingDeleted={mediaIdBeingDeleted}
                        isPending={deleteHistoryMutation.isPending}
                    />
                )}
        </>
    );
};
