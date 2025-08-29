import {Link} from "@tanstack/react-router";
import {formatDateTime} from "@/lib/utils/functions";
import {Separator} from "@/lib/components/ui/separator";
import {TrendItemType} from "@/lib/types/query.options.types";
import {Card, CardContent, CardTitle} from "@/lib/components/ui/card";


interface TrendItemProps {
    item: TrendItemType;
}


export const TrendItem = ({ item }: TrendItemProps) => {
    const { apiId, posterPath, displayName, mediaType, releaseDate, overview } = item;

    return (
        <Card className="h-full">
            <div className="grid grid-cols-12">
                <div className="col-span-5">
                    <Link
                        to="/details/$mediaType/$mediaId"
                        params={{ mediaType, mediaId: apiId }}
                        search={{ external: true }}
                    >
                        <img
                            src={posterPath}
                            alt={displayName}
                            className="rounded-md"
                        />
                    </Link>
                </div>
                <div className="col-span-7">
                    <CardContent className="pt-3">
                        <Link
                            to="/details/$mediaType/$mediaId"
                            params={{ mediaType: mediaType, mediaId: apiId }}
                            search={{ external: true }}
                        >
                            <CardTitle className="flex flex-col items-start">
                                <div className="text-lg line-clamp-2">{displayName}</div>
                                <div className="text-muted-foreground text-sm text-grey italic">
                                    {formatDateTime(releaseDate)}
                                </div>
                            </CardTitle>
                        </Link>
                        <Separator/>
                        <CardContent className="line-clamp-5 p-0">
                            {overview}
                        </CardContent>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
};