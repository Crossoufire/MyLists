import {Fragment} from "react";
import {Separator} from "@/components/ui/separator";
import {UserUpdate} from "@/components/reused/UserUpdate";


export const HistoryDetails = ({ history }) => {
    return (
        <>
            {history.length === 0 ?
                <div className="text-muted-foreground italic">No history found</div>
                :
                history.map(hist =>
                    <Fragment key={hist.date}>
                        <UserUpdate
                            mediaId={hist.media_id}
                            mediaType={hist.media_type}
                            mediaName={hist.media_name}
                            payload={hist.update}
                            date_={hist.date}
                        />
                        <Separator className="mt-0"/>
                    </Fragment>
                )
            }
        </>
    );
};
