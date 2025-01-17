import {CircleCheck} from "lucide-react";


export const MediaInfoCorner = ({ isCommon }) => {
    return (
        <>
            <div className="absolute top-0 right-0 border-solid border-t-0 border-r-[55px] border-b-[55px] border-l-0
            border-[transparent_#030712] opacity-70 rounded-tr-md"/>
            {isCommon && <CircleCheck className="absolute top-2 right-2 h-4 w-4" color="green"/>}
        </>
    );
};
