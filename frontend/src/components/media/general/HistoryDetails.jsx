import {Fragment} from "react";
import {UserUpdate} from "@/components/app/UserUpdate";


export const HistoryDetails = ({ history }) => {
    if (history.length === 0) {
        return <div className="text-muted-foreground italic">No history to display</div>;
    }

    return (
        <>
            {history.map(data =>
                <UserUpdate
                    update={data}
                    key={data.timestamp}
                />
            )}
        </>
    );
};
