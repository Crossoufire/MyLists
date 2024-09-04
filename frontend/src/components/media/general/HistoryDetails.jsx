import {useState} from "react";
import {UserUpdate} from "@/components/app/UserUpdate";
import {MutedText} from "@/components/app/base/MutedText";
import {useDeleteHistoryMutation} from "@/utils/mutations";


export const HistoryDetails = ({ history, mediaType, mediaId }) => {
    const deleteHistory = useDeleteHistoryMutation(mediaType, mediaId);
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState();

    const handleDelete = async (updateId) => {
        setMediaIdBeingDeleted(updateId);
        await deleteHistory.mutate({ updateIds: updateId });
    };

    return (
        <>
            {history.length === 0 ?
                <MutedText>No history to display</MutedText>
                :
                history.map(update =>
                    <UserUpdate
                        key={update.id}
                        update={update}
                        canDelete={true}
                        onDelete={handleDelete}
                        isPending={deleteHistory.isPending}
                        mediaIdBeingDeleted={mediaIdBeingDeleted}
                    />
                )}
        </>
    );
};
