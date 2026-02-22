import {toast} from "sonner";
import {useEffect, useMemo, useState} from "react";
import {Label} from "@/lib/client/components/ui/label";
import {Badge} from "@/lib/client/components/ui/badge";
import {Input} from "@/lib/client/components/ui/input";
import {Switch} from "@/lib/client/components/ui/switch";
import {MediaType, PrivacyType} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {Textarea} from "@/lib/client/components/ui/textarea";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {CollectionItemDetails, DraftItem} from "@/lib/types/collections.types";
import {RadioGroup, RadioGroupItem} from "@/lib/client/components/ui/radio-group";
import {MainThemeIcon, PrivacyIcon} from "@/lib/client/components/general/MainIcons";
import {CollectionSearch} from "@/lib/client/components/collections/CollectionSearch";
import {GripVertical, List, ListOrdered, TextAlignJustify, Trash2} from "lucide-react";


interface CollectionEditorProps {
    mediaType: MediaType;
    submitLabel?: string;
    isSubmitting?: boolean;
    initialData?: {
        title: string;
        ordered: boolean;
        privacy: PrivacyType;
        description?: string | null;
        items: CollectionItemDetails[];
    };
    onSubmit: (payload: {
        title: string;
        ordered: boolean;
        privacy: PrivacyType;
        description?: string | null;
        items: {
            mediaId: number;
            annotation?: string | null;
        }[];
    }) => void;
}


export const CollectionEditor = ({ mediaType, initialData, onSubmit, submitLabel = "Save Collection", isSubmitting }: CollectionEditorProps) => {
    const [items, setItems] = useState<DraftItem[]>([]);
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [ordered, setOrdered] = useState(initialData?.ordered ?? false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [privacy, setPrivacy] = useState<PrivacyType>(initialData?.privacy ?? PrivacyType.PRIVATE);
    const orderedLabel = useMemo(() => (ordered ? "Ranked" : "Unranked"), [ordered]);

    useEffect(() => {
        if (!initialData) return;

        setTitle(initialData.title);
        setPrivacy(initialData.privacy);
        setOrdered(initialData.ordered);
        setDescription(initialData.description ?? "");
        setItems(initialData.items.map((item) => ({
            mediaId: item.mediaId,
            mediaName: item.mediaName,
            mediaCover: item.mediaCover,
            annotation: item.annotation ?? "",
        })));
    }, [initialData]);

    const handleAddItem = (item: DraftItem) => {
        setItems((prev) => {
            if (prev.some((existing) => existing.mediaId === item.mediaId)) {
                toast.message("That media is already in your collection.");
                return prev;
            }
            return [...prev, item];
        });
    };

    const handleRemoveItem = (mediaId: number) => {
        setItems((prev) => prev.filter((item) => item.mediaId !== mediaId));
    };

    const handleDragStart = (index: number) => {
        if (!ordered) return;
        setDragIndex(index);
    };

    const handleDrop = (index: number) => {
        if (dragIndex === null || dragIndex === index) return;

        setItems((prev) => {
            const next = [...prev];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(index, 0, moved);
            return next;
        });

        setDragIndex(null);
    };

    const submitPayload = () => {
        const trimmedTitle = title.trim();
        if (trimmedTitle.length < 3) {
            toast.error("Please provide a title of at least 3 characters.");
            return;
        }
        if (items.length === 0) {
            toast.error("Add at least one item to the collection.");
            return;
        }

        onSubmit({
            privacy,
            ordered,
            title: trimmedTitle,
            description: description?.trim() || null,
            items: items.map((item) => ({
                mediaId: item.mediaId,
                annotation: item.annotation?.trim() || null,
            })),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="font-semibold tracking-tight">
                        2. Collection details
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="gap-1 text-xs capitalize">
                            <MainThemeIcon type={mediaType} size={14}/>
                            {mediaType}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                            {ordered ? <ListOrdered className="size-3"/> : <List className="size-3"/>}
                            {orderedLabel}
                        </Badge>
                    </div>
                </div>
                <Button onClick={submitPayload} disabled={isSubmitting}>
                    {submitLabel}
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-6 max-lg:col-span-12">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            placeholder="Ex: Top 50 Animated Films"
                            onChange={(ev) => setTitle(ev.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(ev) => setDescription(ev.target.value)}
                            placeholder="Describe this collection, what is it all about?"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Search & add items</Label>
                        <CollectionSearch
                            onAdd={handleAddItem}
                            mediaType={mediaType}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Items ({items.length})</Label>
                        </div>
                        {items.length === 0 ?
                            <EmptyState
                                iconSize={35}
                                className="py-20"
                                icon={TextAlignJustify}
                                message="No items yet. Search and add media to build your collection."
                            />
                            :
                            <div className="space-y-3">
                                {items.map((item, idx) =>
                                    <div
                                        key={item.mediaId}
                                        draggable={ordered}
                                        onDrop={() => handleDrop(idx)}
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragEnd={() => setDragIndex(null)}
                                        onDragOver={(ev) => ordered && ev.preventDefault()}
                                        className="flex items-center gap-3 rounded-lg border bg-background p-3"
                                    >
                                        {ordered &&
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="w-6 text-xs font-semibold text-center">
                                                {idx + 1}
                                            </span>
                                                <GripVertical className="size-4"/>
                                            </div>
                                        }
                                        <div className="h-20 w-14 overflow-hidden rounded-md bg-muted">
                                            {item.mediaCover &&
                                                <img
                                                    alt={item.mediaName}
                                                    src={item.mediaCover}
                                                    className="h-full w-full object-cover"
                                                />
                                            }
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="font-semibold line-clamp-1">
                                                {item.mediaName}
                                            </div>
                                            <Input
                                                value={item.annotation ?? ""}
                                                placeholder="Add annotation..."
                                                onChange={(ev) => {
                                                    const nextValue = ev.target.value;
                                                    setItems((prev) => prev.map((entry) => entry.mediaId === item.mediaId
                                                        ? { ...entry, annotation: nextValue } : entry
                                                    ));
                                                }}
                                            />
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.mediaId)}>
                                            <Trash2 className="size-4"/>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        }
                    </div>
                </div>
                <div className="col-span-4 space-y-6 max-lg:col-span-12">
                    <div className="rounded-lg border p-4 space-y-5">
                        <div className="space-y-4">
                            <Label className="text-base">Privacy Settings</Label>
                            <RadioGroup
                                value={privacy}
                                className="space-y-3"
                                onValueChange={(val) => setPrivacy(val as PrivacyType)}
                            >
                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem
                                        className="mt-1"
                                        id="privacy-private"
                                        value={PrivacyType.PRIVATE}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label><PrivacyIcon type={PrivacyType.PRIVATE}/> Only Me</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Visible only to you. This collection is completely hidden from everyone else.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem
                                        className="mt-1"
                                        id="privacy-restricted"
                                        value={PrivacyType.RESTRICTED}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label><PrivacyIcon type={PrivacyType.RESTRICTED}/> Personal</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Not displayed on the community page. It remains visible on your profile
                                            to followers (or anyone if your account is public).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <RadioGroupItem
                                        className="mt-1"
                                        id="privacy-public"
                                        value={PrivacyType.PUBLIC}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label><PrivacyIcon type={PrivacyType.PUBLIC}/> Public</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Visible to everyone. This collection will be featured on the community discovery page.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2 pt-3">
                            <Label>Ranking</Label>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold">
                                        Ranked list
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Enable drag & drop ranking.
                                    </div>
                                </div>
                                <Switch
                                    checked={ordered}
                                    onCheckedChange={setOrdered}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
