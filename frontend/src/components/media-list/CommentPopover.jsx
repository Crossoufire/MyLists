import {MessageCircle} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const CommentPopover = ({ content }) => {
    return (
        <Popover>
            <PopoverTrigger>
                <MessageCircle className="text-blue-500 h-4 w-4"/>
            </PopoverTrigger>
            <PopoverContent align="center" side="top">
                {content}
            </PopoverContent>
        </Popover>
    );
};
