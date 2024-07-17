import {useState} from "react";
import {fetcher} from "@/lib/fetcherLoader.jsx";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {MediaCard} from "@/components/app/MediaCard";
import {Pagination} from "@/components/app/Pagination";
import {createFileRoute} from "@tanstack/react-router";
import {TopRightCornerTriangle} from "@/routes/_private/list/$mediaType.$username";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/$mediaType/$job/$info")({
    component: InfoPage,
    loader: async ({ params }) => fetcher(`/details/${params.mediaType}/${params.job}/${params.info}`),
});


function InfoPage() {
    const apiData = Route.useLoaderData();
    const { mediaType, info } = Route.useParams();
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
        <PageTitle title={`${info}'s ${mediaType} (${apiData.total})`}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                {currentItems.map(media =>
                    <div key={media.media_id} className="col-span-1">
                        <MediaCard media={media} mediaType={mediaType}>
                            {media.in_list && <TopRightCornerTriangle isCommon={media.in_list}/>}
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