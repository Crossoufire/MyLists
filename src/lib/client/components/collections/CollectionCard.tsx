import type {ReactNode} from "react";
import {Link} from "@tanstack/react-router";
import {PrivacyType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/formating";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {Eye, Heart, Layers, Lock, Shuffle} from "lucide-react";
import {CollectionSummary} from "@/lib/types/collections.types";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {MainThemeIcon, PrivacyIcon} from "@/lib/client/components/general/MainIcons";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface CollectionCardProps {
    isOwner?: boolean;
    showOwner?: boolean;
    actions?: ReactNode;
    collection: CollectionSummary;
};


export const CollectionCard = ({ collection, showOwner = false, isOwner = false, actions }: CollectionCardProps) => {
    return (
        <Card className="h-full border bg-card/70 transition-shadow hover:shadow-md">
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">
                            {collection.title}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                            {collection.description || "No description added yet."}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 text-xs capitalize">
                            <MainThemeIcon type={collection.mediaType} size={14}/>
                            {capitalize(collection.mediaType)}
                        </Badge>
                        <Badge variant="outline" className="capitalize gap-1 text-xs">
                            <PrivacyIcon type={collection.privacy}/>
                            {collection.privacy}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Layers className="size-3"/>
                        {collection.itemsCount} items
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Heart className="size-3"/>
                        {collection.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Shuffle className="size-3"/>
                        {collection.copiedCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Eye className="size-3"/>
                        {collection.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        {collection.ordered ? "Ranked" : "Unranked"}
                    </span>
                </div>
                {showOwner &&
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ProfileIcon
                            className="size-6 border"
                            fallbackSize="text-[10px]"
                            user={{ name: collection.ownerName, image: collection.ownerImage ?? "" }}
                        />
                        <span>{collection.ownerName}</span>
                    </div>
                }
            </CardHeader>
            <CardContent className="pt-0"/>
            <CardFooter className="flex items-center justify-between">
                <Button asChild size="sm" variant="outline">
                    <Link to="/collections/$collectionId" params={{ collectionId: collection.id }}>
                        View
                    </Link>
                </Button>
                <div className="flex items-center gap-2" title="Private collection">
                    {actions}
                    {isOwner && collection.privacy === PrivacyType.PRIVATE &&
                        <Lock className="size-4 text-muted-foreground"/>
                    }
                </div>
            </CardFooter>
        </Card>
    );
};
