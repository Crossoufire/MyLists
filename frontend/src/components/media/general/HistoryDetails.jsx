import {Fragment} from "react";
import {UserUpdate} from "@/components/reused/UserUpdate";


export const HistoryDetails = ({ history }) => {
    return (
        <>
            {history.length === 0 ?
                <div className="text-muted-foreground italic">No history to display</div>
                :
                history.map(hist =>
                    <UserUpdate
                        key={hist.date}
                        mediaId={hist.media_id}
                        mediaType={hist.media_type}
                        mediaName={hist.media_name}
                        payload={hist.update}
                        date_={hist.date}
                    />
                )
            }
        </>
    );
};
