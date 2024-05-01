import {toast} from "sonner";
import {useLoading} from "@/hooks/LoadingHook";
import {FaMinus, FaPlus} from "react-icons/fa";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {FormButton} from "@/components/app/base/FormButton";
import {Commentary} from "@/components/media/general/Commentary";
import {LabelLists} from "@/components/media/general/LabelLists";
import {TvUserDetails} from "@/components/media/tv/TvUserDetails";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {HistoryDetails} from "@/components/media/general/HistoryDetails";
import {GamesUserDetails} from "@/components/media/games/GamesUserDetails";
import {BooksUserDetails} from "@/components/media/books/BooksUserDetails";
import {MoviesUserDetails} from "@/components/media/movies/MoviesUserDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


const mediaComponentMap = (value) => {
	const components = {
		movies: MoviesUserDetails,
		series: TvUserDetails,
		anime: TvUserDetails,
		games: GamesUserDetails,
		books: BooksUserDetails,
		default: undefined,
	};

	return components[value] || components.default;
};


export const UserListDetails = ({ apiData, mediaType, mutateData }) => {
	const [isLoading, handleLoading] = useLoading();
	const MediaUserDetails = mediaComponentMap(mediaType);
	const updatesAPI = useApiUpdater(apiData.media.id, mediaType);

	const handleAddMediaUser = async () => {
		const response = await handleLoading(updatesAPI.addMedia);
		if (response) {
			await mutateData({ ...apiData, user_data: response }, false);
			toast.success("Media added to your list");
		}
	};

	const handleDeleteMedia = async () => {
		const confirm = window.confirm("Do you want to remove this media from your list?");
		if (!confirm) {
			return;
		}

		const response = await handleLoading(updatesAPI.deleteMedia);
		if (response) {
			await mutateData({ ...apiData, user_data: false }, false);
			toast.success("Media deleted from your list");
		}
	};

	if (!apiData.user_data) {
		return (
			<div className="w-[300px]">
				<FormButton onClick={handleAddMediaUser} pending={isLoading}>
					<FaPlus size={13}/> &nbsp; Add to your list
				</FormButton>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Tabs defaultValue="yourInfo">
				<TabsList className="w-full items-center justify-start">
					<TabsTrigger value="yourInfo" className="w-full">Your Info</TabsTrigger>
					<TabsTrigger value="history" className="w-full">History ({apiData.user_data.history.length})</TabsTrigger>
					<div className="flex items-center justify-end w-full mr-3 text-primary text-xl">
						<ManageFavorite
							initFav={apiData.user_data.favorite}
							updateFavorite={updatesAPI.favorite}
						/>
					</div>
				</TabsList>
				<TabsContent value="yourInfo" className="w-[300px] p-5 pt-3 bg-card rounded-md">
					<MediaUserDetails
						userData={apiData.user_data}
						totalPages={apiData.media.pages}
						updatesAPI={updatesAPI}
					/>
					<Commentary
						updateComment={updatesAPI.comment}
						initContent={apiData.user_data.comment}
					/>
					<LabelLists
						mediaType={mediaType}
						updatesAPI={updatesAPI}
						initIn={apiData.user_data.labels.already_in}
						initAvailable={apiData.user_data.labels.available}
					/>
				</TabsContent>
				<TabsContent value="history" className="w-[300px] p-5 pt-3 bg-card rounded-md overflow-y-hidden
					hover:overflow-y-auto max-h-[355px]">
					<HistoryDetails
						history={apiData.user_data.history}
					/>
				</TabsContent>
			</Tabs>
			<FormButton variant="destructive" pending={isLoading} onClick={handleDeleteMedia}>
				<FaMinus/>&nbsp; Remove from your list
			</FormButton>
		</div>
	)
};