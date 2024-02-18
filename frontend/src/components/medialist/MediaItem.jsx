import {useState} from "react";
import {cn} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {MediaCard} from "@/components/reused/MediaCard.jsx";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {UserMediaInfo} from "@/components/medialist/UserMediaInfo";
import {useUser} from "@/providers/UserProvider.jsx";


export const MediaItem = ({ isCurrent, mediaType, userData, mediaData, isCommon, activeStatus }) => {
	const { currentUser } = useUser();
	const [isLoading, handleLoading] = useLoading();
	const [hideMedia, setHideMedia] = useState(false);
	const [stateIsCommon, setStateIsCommon] = useState(isCommon);
	const updateUserAPI = useApiUpdater(mediaData.media_id, mediaType);

	const isAllOrSearch = (activeStatus === "All" || activeStatus === "Search");
	const position = mediaType === "movies" ? "bottom-[32px]" : "bottom-[64px]";

	const handleRemoveMedia = async () => {
		const response = await handleLoading(updateUserAPI.deleteMedia);
		if (response) {
			setHideMedia(true);
		}
	};

	const handleStatus = async (status) => {
		await handleLoading(updateUserAPI.status, status);
		setHideMedia(true);
	};

	const handleAddFromOtherList = async (value) => {
		await handleLoading(updateUserAPI.addMedia, value);
		setStateIsCommon(!stateIsCommon);
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
					border-b-[35px] border-l-0 rounded-tr-sm border-[transparent_#2d6f22]"/>
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
					updateUserAPI={updateUserAPI}
				/>
			</MediaCard>
		</div>
	);
};
