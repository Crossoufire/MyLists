import {CircleCheck} from "lucide-react";


export const MediaCornerCommon = ({ isCommon }: { isCommon?: boolean }) => {
    return (
        <>
            <div className="absolute top-0 right-0 border-solid border-t-0 border-r-55 border-b-55 border-l-0
            border-[transparent_#030712] opacity-70 rounded-tr-md"/>
            {isCommon &&
                <div className="absolute top-2 right-2">
                    <CircleCheck className="size-4 text-app-accent"/>
                </div>
            }
        </>
    );
};
