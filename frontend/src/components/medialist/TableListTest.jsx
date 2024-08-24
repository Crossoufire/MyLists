import {toast} from "sonner";
import {useState} from "react";
import * as T from "@/components/ui/table";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/components/ui/badge";
import {LuCheckCircle} from "react-icons/lu";
import {useLoading} from "@/hooks/LoadingHook";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {Route} from "@/routes/_private/list/$mediaType.$username";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {RatingListDrop} from "@/components/medialist/RatingListDrop";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";


// NOT USED  - Just example of how a TableList instead of GridList could be implemented for the media list

const MediaItemsAsTable = ({ apiData, isCurrent }) => {
    return (
        <T.Table className="max-sm:w-[900px] overflow-hidden">
            <T.TableHeader>
                <T.TableRow>
                    <T.TableHead>Name</T.TableHead>
                    <T.TableHead>Status</T.TableHead>
                    <T.TableHead className="text-center w-[35%]">User Details</T.TableHead>
                    <T.TableHead className="text-center">Status Info</T.TableHead>
                    <T.TableHead className="text-center">Edit</T.TableHead>
                </T.TableRow>
            </T.TableHeader>
            <T.TableBody>
                {apiData.media_data.media_list.map(media =>
                    <MediaItemRow
                        media={media}
                        key={media.media_id}
                        isCurrent={isCurrent}
                        filters={apiData.filters}
                        initCommon={apiData.media_data.common_ids.includes(media.media_id)}
                    />
                )}
            </T.TableBody>
        </T.Table>
    )
};


const MediaItemRow = ({ isCurrent, media, filters, initCommon }) => {
    const { mediaType } = Route.useParams();
    const [isLoading, handleLoading] = useLoading();
    const [status, setStatus] = useState(media.status);
    const [isCommon, setIsCommon] = useState(initCommon);
    const [isHidden, setIsHidden] = useState(false);
    const updateUserAPI = useApiUpdater(media.media_id, mediaType);

    const handleRemoveMedia = async () => {
        const response = await handleLoading(updateUserAPI.deleteMedia);
        if (response) {
            setIsHidden(true);
            toast.success("Media successfully deleted");
        }
    };

    const handleStatus = async (status) => {
        const response = await handleLoading(updateUserAPI.status, status);
        if (response) {
            if (filters.status.length === 1) {
                setIsHidden(true);
            }
            setStatus(status);
            toast.success(`Media status changed to ${status}`);
        }
    };

    const handleAddOtherList = async (value) => {
        const response = await handleLoading(updateUserAPI.addMedia, value);
        if (response) {
            setIsCommon(true);
            toast.success("Media added to your list");
        }
    };

    if (isHidden) return;

    return (
        <T.TableRow key={media.media_id} className="text-base">
            <T.TableCell className="flex items-center gap-2">
                <Link to={`/details/${mediaType}/${media.media_id}`}>
                    {media.media_name}
                </Link>
                <div>{isCommon && <LuCheckCircle className="text-green-500"/>}</div>
            </T.TableCell>
            <T.TableCell>
                <Badge variant="outline">{status}</Badge>
            </T.TableCell>
            <T.TableCell className="flex items-center justify-around">
                <ManageFavorite
                    isCurrent={isCurrent}
                    initFav={media.favorite}
                    updateFavorite={updateUserAPI.favorite}
                />
                <RatingListDrop
                    isCurrent={isCurrent}
                    initRating={media.rating}
                    updateRating={updateUserAPI.rating}
                />
                <RedoListDrop
                    isCurrent={isCurrent}
                    initRedo={media.redo}
                    updateRedo={updateUserAPI.redo}
                    isDisabled={status !== "Completed" || mediaType === "games"}
                />
                <CommentPopover
                    isCurrent={isCurrent}
                    initContent={media.comment}
                    updateComment={updateUserAPI.comment}
                />
            </T.TableCell>
            <T.TableCell>
                <SuppMediaInfo
                    media={media}
                    status={status}
                    isCurrent={isCurrent}
                    updateUserAPI={updateUserAPI}
                />
            </T.TableCell>
            <T.TableCell className="text-center">
                {(isCurrent || (!isCurrent && !isCommon)) &&
                    <EditMediaList
                        status={status}
                        isCurrent={isCurrent}
                        handleStatus={handleStatus}
                        allStatus={media.all_status}
                        removeMedia={handleRemoveMedia}
                        addOtherList={handleAddOtherList}
                    />
                }
            </T.TableCell>
        </T.TableRow>
    );
};