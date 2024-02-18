import {Link} from "react-router-dom";
import {Separator} from "@/components/ui/separator";
import {Card, CardTitle, CardContent} from "@/components/ui/card";


export const TrendItem = ({ media, idx }) => {
    return (
        <Card>
            <div className="grid grid-cols-12">
                <div className="col-span-5">
                    <Link to={`/details/${media.media_type}/${media.api_id}?search=True`}>
                        <img src={media.poster_path} className="rounded-md" alt={media.display_name}/>
                    </Link>
                </div>
                <div className="col-span-7">
                    <CardContent className="pt-3">
                        <Link to={`/details/${media.media_type}/${media.api_id}?search=True`}>
                            <CardTitle className="flex flex-col items-start">
                                <div className="text-lg line-clamp-2">{media.display_name}</div>
                                <div className="text-muted-foreground text-sm text-grey mt-1 italic">{media.release_date}</div>
                            </CardTitle>
                        </Link>
                        <Separator/>
                        <CardContent className="line-clamp-5 p-0">
                            {media.overview}
                        </CardContent>
                    </CardContent>
                </div>
            </div>
        </Card>
    )
};
