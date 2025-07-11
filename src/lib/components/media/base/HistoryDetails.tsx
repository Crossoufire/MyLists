import {useState} from "react";
import {HistoryType} from "@/lib/components/types";
import {MutedText} from "@/lib/components/general/MutedText";
import {UserUpdate} from "@/lib/components/general/UserUpdate";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {useDeleteUpdatesMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface HistoryDetailsProps {
    history: HistoryType;
    queryKey: ReturnType<typeof queryKeys.historyKey>;
}


export const HistoryDetails = ({ queryKey, history }: HistoryDetailsProps) => {
    const deleteHistoryMutation = useDeleteUpdatesMutation(queryKey);
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState<number>();

    const handleDelete = (updateId: number) => {
        setMediaIdBeingDeleted(updateId);
        deleteHistoryMutation.mutate({ updateIds: [updateId] });
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
                        mediaIdBeingDeleted={mediaIdBeingDeleted}
                        isPending={deleteHistoryMutation.isPending}
                    />
                )}
        </>
    );
};
