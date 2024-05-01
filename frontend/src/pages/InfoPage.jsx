import {useState} from "react";
import {useParams} from "react-router-dom";
import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaCard} from "@/components/app/MediaCard";
import {Loading} from "@/components/app/base/Loading";
import {Pagination} from "@/components/app/Pagination";


export const InfoPage = () => {
    const { mediaType, job, info } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const { apiData, loading, error } = useFetchData(`/details/${mediaType}/${job}/${info}`);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0 });
    };

    if (error) return <ErrorPage {...error}/>;

    const mediaPerPage = 36;
    const totalPages = Math.ceil(apiData?.total / mediaPerPage);
    const startIndex = (currentPage - 1) * mediaPerPage;
    const endIndex = startIndex + mediaPerPage;
    const currentItems = apiData?.data.slice(startIndex, endIndex);

    return (
        <PageTitle title={`${info}'s ${mediaType} (${apiData?.total || "..."})`}>
            {loading ?
                <Loading/>
                :
                <div className="grid grid-cols-12 lg:gap-4">
                    {currentItems.map(media =>
                        <div className="col-span-4 md:col-span-3 lg:col-span-2">
                            <MediaCard media={media} mediaType={mediaType} botRounded={true}>
                                {media.in_list &&
                                    <div
                                        className="absolute top-[1px] right-[1px] border-solid border-t-0
                                        border-r-[35px] border-b-[35px] border-l-0 rounded-tr-[3px]
                                        border-[transparent_#2d6f22]"
                                    />
                                }
                            </MediaCard>
                        </div>
                    )}
                </div>
            }
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onChangePage={handlePageChange}
            />
        </PageTitle>
    );
};
