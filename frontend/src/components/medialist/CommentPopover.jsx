import {useState} from "react";
import {Button} from "@/components/ui/button";
import {LuMessageSquare} from "react-icons/lu";
import {Textarea} from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const CommentPopover = ({ isCurrent, content, updateComment }) => {
    const [isEdit, setIsEdit] = useState(false);
    const [contentsState, setContentsState] = useState(content || "");

    const checkInitContent = () => {
        if (isCurrent && (contentsState === "" || contentsState === undefined || contentsState === null)) {
            setIsEdit(true);
        }
    };

    const handleSave = async () => {
        if (content === contentsState) return;
        await updateComment.mutateAsync({ payload: contentsState });
        setIsEdit(false);
    };

    const onEditCancel = () => {
        setContentsState(content);
        setIsEdit(false);
    };

    const onPopoverClickOutside = (ev) => {
        if (isEdit && contentsState !== "") {
            ev.preventDefault();
        }
    };

    return (
        <Popover>
            <div className="flex items-center" title="Comment">
                {isCurrent ?
                    <PopoverTrigger onClick={checkInitContent}>
                        <LuMessageSquare className={contentsState && "text-amber-500"}/>
                    </PopoverTrigger>
                    :
                    <>
                        {contentsState ?
                            <PopoverTrigger><LuMessageSquare className="text-amber-500"/></PopoverTrigger>
                            :
                            <LuMessageSquare/>
                        }
                    </>
                }
            </div>
            <PopoverContent align="center" side="top" onInteractOutside={onPopoverClickOutside}>
                {(isCurrent && isEdit) ?
                    <>
                        <Textarea
                            value={contentsState}
                            className="w-full h-[100px]"
                            disabled={updateComment.isPending}
                            placeholder="Enter your comment..."
                            onChange={(ev) => setContentsState(ev.target.value)}
                        />
                        <Button className="mt-3" size="sm" onClick={handleSave}
                        disabled={content === contentsState || updateComment.isPending}>
                            Save
                        </Button>
                        <Button className="ml-3 mt-3" size="sm" variant="destructive" onClick={onEditCancel}
                        disabled={content === contentsState || updateComment.isPending}>
                            Cancel
                        </Button>
                    </>
                    :
                    <div>
                        {isCurrent ?
                            <>
                                <p>{contentsState}</p>
                                <Separator/>
                                <Button className="mt-1" size="sm" onClick={() => setIsEdit(true)}>Edit</Button>
                            </>
                            :
                            contentsState
                        }
                    </div>
                }
            </PopoverContent>
        </Popover>
    );
};
