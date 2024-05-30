import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {Textarea} from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator";


export const Commentary = ({ initContent, updateComment }) => {
    const [isLoading, handleLoading] = useLoading();
    const [commentInput, setCommentInput] = useState(false);
    const [contents, setContents] = useState(initContent || "");
    const [initContents, setInitContents] = useState(initContent || "");

    const buttonText = contents ? "Edit" : "Add";
    const commentText = contents ? "Edit comment" : "Add comment";
    const isContentsEmpty = contents === "" || contents === null;

    const handleComment = () => {
        setCommentInput(!commentInput);
        setContents(initContents);
    };

    const handleSave = async () => {
        if (initContent === contents) return;

        await handleLoading(updateComment, contents);
        setInitContents(contents);
        setCommentInput(false);
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Comment
                <Tooltip text={commentText}>
                    <span role="button" onClick={handleComment} className="text-muted-foreground text-sm mt-1 italic">
                        {buttonText}
                    </span>
                </Tooltip>
            </h4>
            <Separator variant="large"/>
            {commentInput ?
                <>
                    <Textarea
                        value={contents}
                        onChange={(ev) => setContents(ev.target.value)}
                        placeholder="Enter your comment..."
                        className="w-full h-20"
                        disabled={isLoading}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={handleComment} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={(contents === initContents) || isLoading}>
                            Save
                        </Button>
                    </div>
                </>
                :
                <p className="text-muted-foreground italic">
                    {isContentsEmpty ? "No comments added yet" : `${contents}`}
                </p>
            }
        </>
    )
};
