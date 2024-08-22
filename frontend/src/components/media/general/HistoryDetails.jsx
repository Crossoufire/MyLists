import {Fragment} from "react";
import {UserUpdate} from "@/components/app/UserUpdate";
import {MutedText} from "@/components/app/base/MutedText";


export const HistoryDetails = ({ history }) => {
    if (history.length === 0) {
        return <MutedText text="No history to display"/>;
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
