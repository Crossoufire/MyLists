import {MessageCircle} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";


interface DisplayCommentProps {
    size?: number;
    content?: string;
}


export const DisplayComment = ({ content, size = 15 }: DisplayCommentProps) => {
    return (
        <Popover>
            <PopoverTrigger>
                <MessageCircle className="text-blue-500" size={size}/>
            </PopoverTrigger>
            <PopoverContent align="center" side="top" className="max-h-[200px] overflow-y-auto">
                {content}
            </PopoverContent>
        </Popover>
    );
};
