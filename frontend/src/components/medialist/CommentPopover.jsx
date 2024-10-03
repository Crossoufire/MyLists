import {LuMessageCircle} from "react-icons/lu";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const CommentPopover = ({ content }) => {
    return (
        <Popover>
            <PopoverTrigger>
                <LuMessageCircle className="text-blue-500"/>
            </PopoverTrigger>
            <PopoverContent align="center" side="top">
                {content}
            </PopoverContent>
        </Popover>
    );
};
