import {LoaderCircle} from "lucide-react";


export const InitialLoader = () => {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh_-_360px)]">
            <LoaderCircle className="size-12 animate-spin"/>
        </div>
    );
};
