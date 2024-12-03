import {useState} from "react";
import {useDeleteUpdateMutation} from "@mylists/api";
import {MutedText} from "@/components/app/MutedText";
import {UserUpdate} from "@/components/app/UserUpdate";


export const HistoryDetails = ({ queryKey, history }) => {
    const deleteHistory = useDeleteUpdateMutation(queryKey);
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState();

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
