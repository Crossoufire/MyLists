import {Loading} from "@/components/app/base/Loading";
import {MediaItem} from "@/components/medialist/MediaItem";
import {Pagination} from "@/components/app/Pagination.jsx";


export const MediaListData = ({ loading, apiData, mediaType, isCurrent, updatePagination }) => {
    return (
        <>
            {loading ?
                <Loading forPage={false}/>
                :
                <>
                    <div className="grid grid-cols-12 lg:gap-4">
                        {apiData.media_data.media_list.map(media =>
                            <MediaItem
                                key={media.media_id}
                                isCurrent={isCurrent}
                                mediaType={mediaType}
                                userData={apiData.user_data}
                                mediaData={media}
                                isCommon={apiData.media_data.common_ids.includes(media.media_id)}
                                activeStatus={apiData.pagination.status}
                            />
                        )}
                    </div>
                    <Pagination
                        currentPage={apiData.pagination.page}
                        totalPages={apiData.pagination.pages}
                        onChangePage={updatePagination}
                    />
                </>
            }
        </>
    );
};
