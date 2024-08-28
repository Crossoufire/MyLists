import {useState} from "react";
import {fetcher} from "@/lib/fetcherLoader";
import {MediaCard} from "@/components/app/MediaCard";
import {Pagination} from "@/components/app/Pagination";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/components/app/base/PageTitle";
import {TopRightCorner} from "@/components/app/TopRightCorner";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/$mediaType/$job/$name")({
    component: InfoPage,
    loader: async ({ params }) => fetcher(`/details/${params.mediaType}/${params.job}/${params.name}`),
});


function InfoPage() {
    const apiData = Route.useLoaderData();
    const { mediaType, name } = Route.useParams();
    const [currentPage, setCurrentPage] = useState(1);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0 });
    };

    const mediaPerPage = 25;
    const totalPages = Math.ceil(apiData.total / mediaPerPage);
    const startIndex = (currentPage - 1) * mediaPerPage;
    const endIndex = startIndex + mediaPerPage;
    const currentItems = apiData.data.slice(startIndex, endIndex);

    return (
        <PageTitle title={`${name}'s ${mediaType} (${apiData.total})`}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                {currentItems.map(media =>
                    <div key={media.media_id} className="col-span-1">
                        <MediaCard media={media} mediaType={mediaType}>
                            {media.in_list && <TopRightCorner isCommon={media.in_list}/>}
                        </MediaCard>
                    </div>
                )}
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onChangePage={handlePageChange}
            />
        </PageTitle>
    );
}