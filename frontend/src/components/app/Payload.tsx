import React from "react";
import {LuMoveRight} from "react-icons/lu";
import {cn, zeroPad} from "@/utils/functions";


interface PayloadProps {
    className?: string;
    update: Record<string, any>;
}


export const Payload = ({update, className}: PayloadProps) => {
    const FormattedPayload = getUpdatePayload(update.update_type);
    return (
        <div className={cn("flex flex-row gap-2 items-center", className)}>
            <FormattedPayload
                payload={update.payload}
                mediaType={update.media_type}
            />
        </div>
    );
};


const getUpdatePayload = (updateType: string) => {
    const choosePayload: Record<string, React.ReactNode> = {
        status: StatusPayload,
        tv: TVPayload,
        redo: RedoPayload,
        playtime: PlaytimePayload,
        page: PagePayload,
    };

    return choosePayload[updateType];
};


const StatusPayload = ({payload}: { payload: { old_value?: string; new_value: string } }) => {
    return (
        <>
            {payload.old_value ?
                <>{payload.old_value} <LuMoveRight/> {payload.new_value}</>
                :
                payload.new_value
            }
        </>
    );
};


const TVPayload = ({payload}: { payload: { old_value: number[]; new_value: number[] } }) => {
    return (
        <>
            S{zeroPad(payload.old_value[0])}.E{zeroPad(payload.old_value[1])} <LuMoveRight/> S{zeroPad(payload.new_value[0])}.E{zeroPad(payload.new_value[1])}
        </>
    );
};


const RedoPayload = ({payload, mediaType}: { payload: { old_value: number; new_value: number }; mediaType: string }) => {
    const name = (mediaType === "books") ? "Re-read" : "Re-watched";
    return <>{name} {payload.old_value}x <LuMoveRight/> {payload.new_value}x</>;
};


const PlaytimePayload = ({payload}: { payload: { old_value: number; new_value: number } }) => {
    return <>{payload.old_value / 60} h <LuMoveRight/> {payload.new_value / 60} h</>;
};


const PagePayload = ({payload}: { payload: { old_value: number; new_value: number } }) => {
    return <>p. {payload.old_value} <LuMoveRight/> p. {payload.new_value}</>;
};
