import {MoveRight} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {zeroPad} from "@/lib/utils/functions";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {profileOptions} from "@/lib/react-query/query-options/query-options";


interface PayloadProps {
    className?: string;
    update: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userUpdates"][0];
}


export const Payload = ({ update, className }: PayloadProps) => {
    const FormattedPayload = getUpdatePayload(update.updateType);
    return (
        <div className={cn("flex flex-row gap-2 items-center", className)}>
            <FormattedPayload
                payload={update.payload!}
                mediaType={update.mediaType}
            />
        </div>
    );
};


const getUpdatePayload = (updateType: UpdateType) => {
    const choosePayload = {
        status: StatusPayload,
        tv: TVPayload,
        redo: RedoPayload,
        playtime: PlaytimePayload,
        page: PagePayload,
        chapter: ChapterPayload,
    };
    return choosePayload[updateType];
};


const StatusPayload = ({ payload }: { payload: Record<string, any> }) => {
    return (
        <>
            {payload.old_value ?
                <>{payload.old_value} <MoveRight className="w-4 h-4"/> {payload.new_value}</>
                :
                payload.new_value
            }
        </>
    );
};


const TVPayload = ({ payload }: { payload: Record<string, any> }) => {
    return (
        <>
            S{zeroPad(payload.old_value[0])}.E{zeroPad(payload.old_value[1])} <MoveRight className="w-4 h-4"/> S{zeroPad(payload.new_value[0])}.E{zeroPad(payload.new_value[1])}
        </>
    );
};


const RedoPayload = ({ payload, mediaType }: { payload: Record<string, any>, mediaType: MediaType }) => {
    const name = (mediaType === MediaType.BOOKS) ? "Re-read" : "Re-watched";

    if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
        return (
            <>{name} {payload.old_value}x S. <MoveRight className="w-4 h-4"/> {payload.new_value}x S.</>
        );
    }

    return (
        <>{name} {payload.old_value}x <MoveRight className="w-4 h-4"/> {payload.new_value}x</>
    );
};


const PlaytimePayload = ({ payload }: { payload: Record<string, any> }) => {
    return <>{payload.old_value / 60} h <MoveRight className="w-4 h-4"/> {payload.new_value / 60} h</>;
};


const PagePayload = ({ payload }: { payload: Record<string, any> }) => {
    return <>p. {payload.old_value} <MoveRight className="w-4 h-4"/> p. {payload.new_value}</>;
};


const ChapterPayload = ({ payload }: { payload: Record<string, any> }) => {
    return <>chpt. {payload.old_value} <MoveRight className="w-4 h-4"/> chpt. {payload.new_value}</>;
};
