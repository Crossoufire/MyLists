import {cn, zeroPad} from "@/lib/utils";
import {FaLongArrowAltRight} from "react-icons/fa";


export const Payload = ({ update, className }) => {
    const FormattedPayload = getUpdatePayload(update.update_type);
    return (
        <div className={cn("flex flex-row gap-2 items-center", className)}>
            <FormattedPayload payload={update.payload} mediaType={update.media_type}/>
        </div>
    );
};


const getUpdatePayload = (updateType) => {
    if (updateType === "status") {
        return StatusPayload;
    }
    else if (updateType === "tv") {
        return TVPayload;
    }
    else if (updateType === "redo") {
        return RedoPayload;
    }
    else if (updateType === "playtime") {
        return PlaytimePayload;
    }
    else if (updateType === "page") {
        return PagePayload;
    }
    else {
        return StatusPayload;
    }
};

const StatusPayload = ({ payload }) => {
    return (
        <>
            {payload.old_value ?
                <>{payload.old_value} <FaLongArrowAltRight size={16}/> {payload.new_value}</>
                :
                payload.new_value
            }
        </>
    );
};

const TVPayload = ({ payload }) => {
    return (
      <>
          S{zeroPad(payload.old_value[0])}.E{zeroPad(payload.old_value[1])} <FaLongArrowAltRight size={16}/> S{zeroPad(payload.new_value[0])}.E{zeroPad(payload.new_value[1])}
      </>
    );
};

const RedoPayload = ({ payload, mediaType }) => {
    const name = (mediaType === "books") ? "Re-read" : "Re-watched";

    return <>{name} {payload.old_value}x <FaLongArrowAltRight size={16}/> {payload.new_value}x</>;
};

const PlaytimePayload = ({ payload }) => {
    return <>{payload.old_value / 60} h <FaLongArrowAltRight size={16}/> {payload.new_value / 60} h</>;
};

const PagePayload = ({ payload }) => {
    return <>p. {payload.old_value} <FaLongArrowAltRight size={16}/> p. {payload.new_value}</>;
};