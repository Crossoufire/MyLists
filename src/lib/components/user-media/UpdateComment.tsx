import {useEffect, useState} from "react";
import {Button} from "@/lib/components/ui/button";
import {Textarea} from "@/lib/components/ui/textarea";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/app/MutedText";


interface CommentaryProps {
    updateComment?: any;
    content: string | null | undefined;
}


export const UpdateComment = ({ content, updateComment }: CommentaryProps) => {
    const [commentInput, setCommentInput] = useState(false);
    const [updatedContent, setUpdatedContent] = useState(content);

    useEffect(() => {
        setUpdatedContent(content);
    }, [content]);

    const handleComment = () => {
        setCommentInput(!commentInput);
        setUpdatedContent(content);
    };

    const handleSave = () => {
        if (content === updatedContent) return;
        updateComment.mutate({ payload: updatedContent });
        setCommentInput(false);
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Comment
                <MutedText className="text-sm mt-1">
                    <span role="button" onClick={handleComment}>{content ? "Edit" : "Add"}</span>
                </MutedText>
            </h4>
            <Separator/>
            {commentInput ?
                <>
                    <Textarea
                        className={"w-full h-20"}
                        value={updatedContent ?? ""}
                        disabled={updateComment.isPending}
                        placeholder={"Enter your comment..."}
                        onChange={(ev) => setUpdatedContent(ev.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={handleComment} disabled={updateComment.isPending}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={(content === updatedContent) || updateComment.isPending}>
                            Save
                        </Button>
                    </div>
                </>
                :
                <MutedText className="text-sm break-words max-h-[150px] overflow-y-auto">
                    {updatedContent ? `${updatedContent}` : "No comments added yet"}
                </MutedText>
            }
        </>
    );
};
