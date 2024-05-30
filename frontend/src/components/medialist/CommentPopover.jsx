import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useLoading} from "@/hooks/LoadingHook";
import {LuMessageSquare} from "react-icons/lu";
import {Tooltip} from "@/components/ui/tooltip";
import {Textarea} from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const CommentPopover = ({ isCurrent, initContent, updateComment }) => {
    const [isLoading, handleLoading] = useLoading();
    const [isEdit, setIsEdit] = useState(false);
    const [contentsState, setContentsState] = useState(initContent || "");
    const [initContentState, setInitContentState] = useState(initContent || "");

    const checkInitContent = () => {
        if (isCurrent && contentsState === "") {
            setIsEdit(true);
        }
    };

    const handleSave = async () => {
        if (initContentState === contentsState) {
            return;
        }

        await handleLoading(updateComment, contentsState);
        setInitContentState(contentsState);
        setIsEdit(false);
    };

    const onEditCancel = () => {
        setContentsState(initContentState);
        setIsEdit(false);
    };

    const onPopoverClickOutside = (ev) => {
        if (isEdit && contentsState !== "") {
            ev.preventDefault();
        }
    };

    return (
        <Popover>
            <Tooltip text="Comment">
                <div className="flex items-center">
                    {isCurrent ?
                        <PopoverTrigger onClick={checkInitContent}>
                            <LuMessageSquare className={contentsState && "text-amber-500"}/>
                        </PopoverTrigger>
                        :
                        <>
                            {contentsState ?
                                <PopoverTrigger>
                                    <LuMessageSquare className="text-amber-500"/>
                                </PopoverTrigger>
                                :
                                <LuMessageSquare/>
                            }
                        </>
                    }
                </div>
            </Tooltip>
            <PopoverContent align="center" side="top" onInteractOutside={onPopoverClickOutside}>
                {(isCurrent && isEdit) ?
                    <>
                        <Textarea
                            value={contentsState}
                            onChange={(ev) => setContentsState(ev.target.value)}
                            placeholder="Enter your comment..."
                            className="w-full h-[100px]"
                            disabled={isLoading}
                        />
                        <Button className="mt-3" size="sm" onClick={handleSave}
                        disabled={initContentState === contentsState || isLoading}>
                            Save
                        </Button>
                        <Button className="ml-3 mt-3" size="sm" variant="destructive" onClick={onEditCancel}
                        disabled={initContentState === contentsState || isLoading}>
                            Cancel
                        </Button>
                    </>
                    :
                    <div>
                        {isCurrent ?
                            <>
                                <p>{contentsState}</p>
                                <Separator/>
                                <Button className="mt-1" size="sm" onClick={() => setIsEdit(true)}>
                                    Edit
                                </Button>
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
