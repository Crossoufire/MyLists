import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {DropdownMenu} from "@radix-ui/react-dropdown-menu";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {Copy, Eye, Heart, Layers, MoreVertical, Pen, Trash2} from "lucide-react";
import {communityCollectionsOptions} from "@/lib/client/react-query/query-options/query-options";
import {DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";


interface CollectionCardProps {
    isOwner?: boolean;
    collection: Awaited<ReturnType<NonNullable<ReturnType<typeof communityCollectionsOptions>["queryFn"]>>>["items"][number];
}


export const CollectionCard = ({ collection, isOwner = false }: CollectionCardProps) => {

    // TODO: create a delete collection mutation
    const handleDelete = async () => {

    }

    return (
        <div className="max-w-95">
            <Link to="/collections/$collectionId" params={{ collectionId: collection.id }}>
                <div className="aspect-video rounded-lg border overflow-hidden duration-200 hover:border-app-accent/50">
                    <div className="relative flex h-full items-center justify-center p-6">
                        {collection.previews.map((item, idx, arr) => {
                            const offset = idx - (arr.length - 1) / 2;

                            return (
                                <div
                                    key={item.mediaId}
                                    style={{ zIndex: idx, transform: `translateX(${offset * 60}%)` }}
                                    className="absolute aspect-2/3 w-1/3 overflow-hidden rounded-md border"
                                >
                                    <img
                                        alt={item.mediaName}
                                        src={item.mediaCover}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Link>

            <div className="pt-1">
                <div className="flex items-baseline justify-between">
                    <div className="pl-1">
                        <h3 className="flex gap-2 items-center font-bold">
                            <MainThemeIcon size={14} type={collection.mediaType} className="mt-0.5"/>
                            {collection.title}
                        </h3>
                        {!isOwner &&
                            <Link to="/profile/$username" params={{ username: collection.ownerName }}>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground -ml-1 hover:text-app-accent">
                                    <ProfileIcon
                                        fallbackSize="text-xs"
                                        user={{ image: collection.ownerImage, name: collection.ownerName }}
                                    />
                                    {collection.ownerName}
                                </div>
                            </Link>
                        }
                    </div>
                    <div className={cn("flex flex-wrap gap-4", !isOwner && "pr-1")}>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-semibold" title="Media Count">
                            <Layers className="size-3"/> {collection.itemsCount}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-semibold" title="Liked Count">
                            <Heart className="size-4"/> {collection.likeCount}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-semibold" title="Viewed Count">
                            <Eye className="size-4"/> {collection.viewCount}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-semibold" title="Copied Count">
                            <Copy className="size-4"/> {collection.copiedCount}
                        </div>
                        {isOwner &&
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button>
                                        <MoreVertical className="size-4 opacity-60 hover:opacity-100"/>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Link to="/collections/$collectionId/edit" params={{ collectionId: collection.id }}>
                                        <DropdownMenuItem>
                                            <Pen className="size-4"/> Edit
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem className="focus:bg-red-500/10" onClick={handleDelete}>
                                        <Trash2 className="text-red-500"/>
                                        <span className="text-red-500">Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};
