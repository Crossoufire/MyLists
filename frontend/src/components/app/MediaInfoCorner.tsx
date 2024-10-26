import React from "react";
import {LuCheckCircle} from "react-icons/lu";


export const MediaInfoCorner = ({isCommon}: { isCommon: boolean }) => {
    return (
        <>
            <div className="absolute top-0 right-0 border-solid border-t-0 border-r-[55px] border-b-[55px] border-l-0
            border-[transparent_#030712] opacity-70 rounded-tr-md"/>
            {isCommon && <LuCheckCircle className="absolute top-2 right-2" color="green"/>}
        </>
    );
};
