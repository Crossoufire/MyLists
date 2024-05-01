import {toast} from "sonner";
import {useState} from "react";
import {cn} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {useUser} from "@/providers/UserProvider";
import {MediaCard} from "@/components/app/MediaCard";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {UserMediaInfo} from "@/components/medialist/UserMediaInfo";


export const MediaItem = ({ isCurrent, mediaType, userData, mediaData, isCommon, activeStatus }) => {
	const { currentUser } = useUser();
	const [isLoading, handleLoading] = useLoading();
	const [stateIsCommon, setStateIsCommon] = useState(isCommon);
	const [hideMedia, setHideMedia] = useState(false);
	const updateUserAPI = useApiUpdater(mediaData.media_id, mediaType);
	const position = mediaType === "movies" ? "bottom-[32px]" : "bottom-[64px]";
	const isAllOrSearch = (activeStatus === "All" || activeStatus === "Search");

	const handleRemoveMedia = async () => {
		const response = await handleLoading(updateUserAPI.deleteMedia);
		if (response) {
			setHideMedia(true);
			toast.success("Media successfully deleted");
		}
	};

	const handleStatus = async (status) => {
		const response = await handleLoading(updateUserAPI.status, status);
		if (response) {
			setHideMedia(true);
			toast.success(`Media status changed to ${status}`);
		}
	};

	const handleAddFromOtherList = async (value) => {
		const response = await handleLoading(updateUserAPI.addMedia, value);
		if (response) {
			setStateIsCommon(!stateIsCommon);
			toast.success("Media added to your list");
		}
	};

	if (hideMedia) return;

	return (
		<div className="col-span-4 md:col-span-3 lg:col-span-2">
			<MediaCard media={mediaData} mediaType={mediaType} isLoading={isLoading}>
				{(currentUser && (isCurrent || (!isCurrent && !stateIsCommon))) &&
					<EditMediaList
						isCurrent={isCurrent}
						allStatus={mediaData.all_status}
						mediaStatus={mediaData.status}
						handleStatus={handleStatus}
						removeMedia={handleRemoveMedia}
						addFromOtherList={handleAddFromOtherList}
					/>
				}
				{isAllOrSearch &&
					<div className={cn("absolute flex justify-center items-center h-[32px] w-full opacity-95 " +
						"bg-gray-700 border border-x-black", position)}>
						{mediaData.status}
					</div>
				}
				{stateIsCommon &&
					<div className="absolute top-[1px] right-[1px] border-solid border-t-0 border-r-[35px]
					border-b-[35px] border-l-0 rounded-tr-[3px] border-[transparent_#2d6f22]"/>
				}
				<UserMediaInfo
					isCurrent={isCurrent}
					mediaType={mediaType}
					mediaData={mediaData}
					userData={userData}
					updateUserAPI={updateUserAPI}
				/>
				<SuppMediaInfo
					isCurrent={isCurrent}
					mediaType={mediaType}
					mediaData={mediaData}
					mediaStatus={mediaData.status}
					updateUserAPI={updateUserAPI}
				/>
			</MediaCard>
		</div>
	);
};
