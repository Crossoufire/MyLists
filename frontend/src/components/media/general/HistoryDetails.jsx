import {Fragment} from "react";
import {UserUpdate} from "@/components/app/UserUpdate.jsx";


export const HistoryDetails = ({ history }) => {
    if (history.length === 0) {
        return <div className="text-muted-foreground italic">No history to display</div>;
    }

    return (
        <>
            {history.map(data =>
                <UserUpdate
                    key={data.date}
                    mediaId={data.media_id}
                    mediaType={data.media_type}
                    mediaName={data.media_name}
                    payload={data.update}
                    date_={data.date}
                />
            )}
        </>
    );
};
