import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {Textarea} from "@/components/ui/textarea";
import {FaCommentAlt, FaRegCommentAlt} from "react-icons/fa";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const CommentPopover = ({ isCurrent, mediaName, initContent, updateComment }) => {
    const [isLoading, handleLoading] = useLoading();
    const [contents, setContents] = useState(initContent || "");
    const [initContents, setInitContents] = useState(initContent || "");

    const handleSave = async () => {
        if (initContent === contents) {
            return;
        }
        await handleLoading(updateComment, contents);
        setInitContents(contents);
    };

    return (
        <Popover>
            <Tooltip text="Comment">
                <div className="flex items-center">
                    {(!isCurrent && !contents) &&
                        <FaRegCommentAlt/>
                    }
                    {(!isCurrent && contents) &&
                        <PopoverTrigger>
                            <FaCommentAlt className="text-amber-500"/>
                        </PopoverTrigger>
                    }
                    {(isCurrent && !contents) &&
                        <PopoverTrigger>
                            <FaRegCommentAlt/>
                        </PopoverTrigger>
                    }
                    {(isCurrent && contents) &&
                        <PopoverTrigger>
                            <FaCommentAlt className="text-amber-500"/>
                        </PopoverTrigger>
                    }
                </div>
            </Tooltip>
            <PopoverContent align="center" side="top">
                {isCurrent ?
                    <>
                        <Textarea
                            value={contents}
                            onChange={(ev) => setContents(ev.target.value)}
                            placeholder="Enter your comment..."
                            className="w-full h-[100px]"
                            disabled={isLoading}
                        />
                        <Button className="mt-3" size="sm" onClick={handleSave} disabled={(contents === initContents) || isLoading}>
                            Save
                        </Button>
                    </>
                    :
                    <p>{contents}</p>
                }
            </PopoverContent>
        </Popover>
    );
};
