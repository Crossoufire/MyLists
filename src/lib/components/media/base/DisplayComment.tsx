import {MessageCircle} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";


export const DisplayComment = ({ content }: { content?: string }) => {
    return (
        <Popover>
            <PopoverTrigger>
                <MessageCircle className="text-blue-500 h-4 w-4"/>
            </PopoverTrigger>
            <PopoverContent align="center" side="top" className="max-h-[200px] overflow-y-auto">
                {content}
            </PopoverContent>
        </Popover>
    );
};
