import {Button} from "@/components/ui/button";
import {useLoading} from "@/hooks/LoadingHook";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/primitives/Loading";
import {MediaSearch} from "@/components/navbar/MediaSearch";


export const ShowSearch = ({ query, activePage, results, resetSearch, searchMedia }) => {
    const [isLoading, handleLoading] = useLoading(0);

    if (query.length > 1 && results === undefined) {
        return (
            <div className="z-20 absolute h-[52px] w-80 top-11 bg-background border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    <Loading forPage={false}/>
                </div>
            </div>
        );
    }

    if (results === undefined) {
        return;
    }

    if (results.items.length === 0) {
        return (
            <div className="z-20 absolute h-[40px] w-80 top-11 bg-background border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    Sorry, no matches found
                </div>
            </div>
        );
    }

    const handleClickNext = async () => {
        await handleLoading(searchMedia, activePage + 1);
    };

    const handleClickPrev = async () => {
        await handleLoading(searchMedia, activePage - 1);
    };

    return (
        <div className="z-20 absolute max-h-[600px] w-80 top-11 bg-background border rounded-md font-medium overflow-y-auto">
            <div className="flex justify-between items-center mt-3 px-3">
                <div>
                    <Button variant="secondary" size="sm" className="mr-2" onClick={handleClickPrev} disabled={activePage === 1}>
                        Previous
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleClickNext} disabled={results.pages === 1}>
                        Next
                    </Button>
                </div>
                <div>Page: {activePage} / {results.pages}</div>
            </div>
            <Separator className="mt-3"/>
            {isLoading ?
                <div className="ml-2 mt-2 mb-3">
                    <Loading forPage={false}/>
                </div>
                :
                results.items.map(media =>
                    <MediaSearch
                        key={media.api_id}
                        apiId={media.api_id}
                        name={media.name}
                        mediaType={media.media_type}
                        thumbnail={media.image_cover}
                        date={media.date}
                        resetSearch={resetSearch}
                    />
                )
            }
        </div>
    );
};
