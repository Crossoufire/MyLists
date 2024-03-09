import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {Textarea} from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator";
import {FaCommentAlt, FaRegCommentAlt} from "react-icons/fa";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const CommentPopover = ({ isCurrent, initContent, updateComment }) => {
    const [isLoading, handleLoading] = useLoading();
    const [isEdit, setIsEdit] = useState(false);
    const [contents, setContents] = useState(initContent || "");
    const [initContents, setInitContents] = useState(initContent || "");

    useEffect(() => {
        if (isCurrent) {
            setIsEdit(initContents === "");
        }
    }, [isCurrent, initContent]);

    const handleSave = async () => {
        if (initContent === contents) {
            return;
        }
        await handleLoading(updateComment, contents);
        setInitContents(contents);
        setIsEdit(false);
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
                {(isCurrent && isEdit) ?
                    <>
                        <Textarea
                            value={contents}
                            onChange={(ev) => setContents(ev.target.value)}
                            onBlur={() => setIsEdit(false)}
                            placeholder="Enter your comment..."
                            className="w-full h-[100px]"
                            disabled={isLoading}
                        />
                        <Button className="mt-3" size="sm" onClick={handleSave} disabled={(contents === initContents) || isLoading}>
                            Save
                        </Button>
                        <Button className="ml-3 mt-3" size="sm" variant="destructive" onClick={() => setIsEdit(false)}>
                            Cancel
                        </Button>
                    </>
                    :
                    <p>
                        {isCurrent ?
                            <>
                                <div>{contents}</div>
                                <Separator/>
                                <Button className="mt-1" size="sm" onClick={() => setIsEdit(true)}>Edit</Button>
                            </>
                            :
                            contents
                        }
                    </p>
                }
            </PopoverContent>
        </Popover>
    );
};
