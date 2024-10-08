import {useState} from "react";
import {UserUpdate} from "@/components/app/UserUpdate";
import {MutedText} from "@/components/app/base/MutedText";
import {useDeleteUpdateMutation} from "@/api/mutations/simpleMutations.js";


export const HistoryDetails = ({ history, mediaType, mediaId }) => {
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState();
    const deleteHistory = useDeleteUpdateMutation(["details", mediaType, mediaId.toString()]);

    const handleDelete = (updateId) => {
        setMediaIdBeingDeleted(updateId);
        deleteHistory.mutate({ updateIds: [updateId] });
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
