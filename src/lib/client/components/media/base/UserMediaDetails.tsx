import {toast} from "sonner";
import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/formating";
import {Card} from "@/lib/client/components/ui/card";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {Button} from "@/lib/client/components/ui/button";
import {ImageOff, Link2, UploadCloud, X} from "lucide-react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {TagsLists} from "@/lib/client/components/media/base/TagsLists";
import {UserMedia, UserMediaItem} from "@/lib/types/query.options.types";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {UpdateComment} from "@/lib/client/components/media/base/UpdateComment";
import {HistoryDetails} from "@/lib/client/components/media/base/HistoryDetails";
import {UpdateFavorite} from "@/lib/client/components/media/base/UpdateFavorite";
import {historyOptions} from "@/lib/client/react-query/query-options/query-options";
import {UserMediaSpecificDetails} from "@/lib/client/components/media/base/UserMediaSpecificDetails";
import {
    useRemoveMediaFromListMutation,
    UserMediaQueryOption,
    useUpdateCustomCoverMutation,
    useUpdateUserMediaMutation
} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UserMediaDetailsProps {
    mediaType: MediaType;
    queryOption: UserMediaQueryOption;
    userMedia: UserMedia | UserMediaItem;
}


export const UserMediaDetails = ({ userMedia, mediaType, queryOption }: UserMediaDetailsProps) => {
    const queryClient = useQueryClient();
    const history = useQuery(historyOptions(mediaType, userMedia.mediaId)).data;
    const updateCustomCoverMutation = useUpdateCustomCoverMutation(queryOption);
    const removeMediaFromListMutation = useRemoveMediaFromListMutation(queryOption);
    const [activeTab, setActiveTab] = useState<"progress" | "history" | "custom">("progress");
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryOption);

    const handleRemoveMediaFromList = () => {
        if (!window.confirm(`Do you want to remove this ${mediaType} from your list?`)) return;
        removeMediaFromListMutation.mutate({ data: { mediaType, mediaId: userMedia.mediaId } }, {
            onSuccess: () => {
                toast.success(`${capitalize(mediaType)} removed from your list`);
                queryClient.removeQueries({ queryKey: historyOptions(mediaType, userMedia.mediaId).queryKey });
            },
        });
    };

    const tabs: TabItem<"progress" | "history" | "custom">[] = [
        {
            id: "progress",
            isAccent: true,
            label: "Progress",
        },
        {
            id: "history",
            label: `History (${history?.length})`,
        },
        {
            id: "custom",
            label: "Custom",
        }
    ]

    return (
        <Card className="bg-popover max-w-94 w-full">
            <TabHeader tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} className="px-2.5">
                <UpdateFavorite
                    isFavorite={userMedia.favorite}
                    updateFavorite={updateUserMediaMutation}
                />
            </TabHeader>

            {activeTab === "progress" ?
                <div className="space-y-2 px-4 mt-1">
                    <UserMediaSpecificDetails
                        mediaType={mediaType}
                        userMedia={userMedia}
                        queryOption={queryOption}
                    />
                    <UpdateComment
                        content={userMedia.comment}
                        updateComment={updateUserMediaMutation}
                    />
                    <TagsLists
                        mediaType={mediaType}
                        queryOption={queryOption}
                        mediaId={userMedia.mediaId}
                        tags={userMedia?.tags ?? []}
                    />
                </div>
                :
                activeTab === "custom" ?
                    <CustomCoverTabContent
                        mediaType={mediaType}
                        userMedia={userMedia}
                        mutation={updateCustomCoverMutation}
                    />
                    :
                    <div className="overflow-y-auto scrollbar-thin max-h-83 px-1">
                        <HistoryDetails
                            mediaType={mediaType}
                            history={history ?? []}
                            mediaId={userMedia.mediaId}
                        />
                    </div>
            }

            <Button variant="destructive" className="w-full mt-4" onClick={handleRemoveMediaFromList}>
                Remove from your list
            </Button>
        </Card>
    );
};


interface CustomCoverTabContentProps {
    mediaType: MediaType;
    userMedia: UserMedia | UserMediaItem;
    mutation: ReturnType<typeof useUpdateCustomCoverMutation>;
}


const CustomCoverTabContent = ({ mediaType, userMedia, mutation }: CustomCoverTabContentProps) => {
    const [imageUrl, setImageUrl] = useState("");
    const [fileInputKey, setFileInputKey] = useState(0);
    const [mode, setMode] = useState<"link" | "upload">("link");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const resetForm = () => {
        setImageUrl("");
        setMode("link");
        setImageFile(null);
        setFileInputKey((prev) => prev + 1);
    };

    const handleSubmit = () => {
        const formData = new FormData();
        formData.append("mediaType", mediaType);
        formData.append("mediaId", userMedia.mediaId.toString());

        if (mode === "link") {
            const value = imageUrl.trim();
            if (!value) {
                toast.error("Please provide an image link.");
                return;
            }
            formData.append("imageUrl", value);
        }
        else {
            if (!imageFile) {
                toast.error("Please select an image to upload.");
                return;
            }
            formData.append("imageFile", imageFile);
        }

        mutation.mutate({ data: formData }, {
            onError: (err) => toast.error(err?.message || "Could not update the custom cover."),
            onSuccess: () => {
                resetForm();
                toast.success("Custom cover saved.");
            },
        });
    };

    const handleRemove = () => {
        const formData = new FormData();
        formData.append("mediaType", mediaType);
        formData.append("mediaId", userMedia.mediaId.toString());
        formData.append("remove", "true");

        mutation.mutate({ data: formData }, {
            onError: (err) => toast.error(err?.message || "Could not remove the custom cover."),
            onSuccess: () => {
                resetForm();
                toast.success("Custom cover removed.");
            },
        });
    };

    return (
        <div className="space-y-4 px-4 mt-1">
            <div className="flex justify-center items-center">
                {userMedia.customCover ?
                    <div className="relative">
                        <img
                            alt="Custom Cover"
                            src={userMedia.customCover}
                            className="h-52 rounded-md border object-cover"
                        />
                        <div
                            role="button"
                            onClick={handleRemove}
                            title="Remove custom cover"
                            className="absolute -top-2 -right-2.5 rounded-full bg-destructive p-1"
                        >
                            <X className="size-4"/>
                        </div>
                    </div>
                    :
                    <div className="h-52 w-35 flex flex-col gap-2 px-2 justify-center text-center items-center rounded-md border border-dashed text-sm text-muted-foreground">
                        <ImageOff className="size-6"/>
                        No custom cover set for this media
                    </div>
                }
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant={mode === "link" ? "emeraldy" : "outline"}
                    onClick={() => {
                        setMode("link");
                        setImageFile(null);
                        setFileInputKey((prev) => prev + 1);
                    }}
                >
                    <Link2 className="size-4"/> Cover Link
                </Button>
                <Button
                    variant={mode === "upload" ? "emeraldy" : "outline"}
                    onClick={() => {
                        setImageUrl("");
                        setMode("upload");
                    }}
                >
                    <UploadCloud className="size-4"/> Upload Cover
                </Button>
            </div>

            {mode === "link" ?
                <div className="space-y-2">
                    <Label htmlFor="custom-cover-url">Cover URL</Label>
                    <Input
                        value={imageUrl}
                        id="custom-cover-url"
                        placeholder="https://example.com/cover.jpg"
                        onChange={(ev) => setImageUrl(ev.target.value)}
                    />
                </div>
                :
                <div className="space-y-2">
                    <Label htmlFor="custom-cover-file">Upload Cover</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        key={fileInputKey}
                        id="custom-cover-file"
                        onChange={(ev) => setImageFile(ev.target.files?.[0] ?? null)}
                    />
                </div>
            }

            <div className="pb-6 border-b">
                <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
                    Save Custom Cover
                </Button>
            </div>
        </div>
    );
};
