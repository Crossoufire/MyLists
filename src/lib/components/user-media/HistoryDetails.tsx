import {useState} from "react";
import {MutedText} from "@/lib/components/app/MutedText";
import {UserUpdate} from "@/lib/components/app/UserUpdate";
import {historyOptions} from "@/lib/react-query/query-options";
import {useDeleteUpdatesMutation} from "@/lib/react-query/mutations/user-media.mutations";


interface HistoryDetailsProps {
    queryKey: string[];
    history: Awaited<ReturnType<NonNullable<ReturnType<typeof historyOptions>["queryFn"]>>>;
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
