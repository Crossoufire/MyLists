import {capitalize} from "@/lib/utils";
import {useEffect, useState} from "react";
import {ErrorPage} from "@/pages/ErrorPage";
import {useUser} from "@/providers/UserProvider";
import {useFetchData, useFetchData2} from "@/hooks/FetchDataHook";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {useParams, useSearchParams} from "react-router-dom";
import {MediaListData} from "@/components/medialist/MediaListData";
import {NavStatusList} from "@/components/medialist/NavStatusList";
import {MediaListStats} from "@/components/medialist/MediaListStats";
import {MediaListLabels} from "@/components/medialist/MediaListLabels.jsx";
import {TitleStatusList} from "@/components/medialist/TitleStatusList";
import {SearchMediaList} from "@/components/medialist/SearchMediaList";
import {CommonMediaList} from "@/components/medialist/CommonMediaList";
import {FilterAndSortList} from "@/components/medialist/FilterAndSortList";
import {NavigationMediaList} from "@/components/medialist/NavigationMediaList";
import {ProfileHeader} from "@/components/profile/ProfileHeader.jsx";
import {AllUpdates} from "@/components/profile/AllUpdates.jsx";
import {FollowsFollowers} from "@/components/profile/FollowsFollowers.jsx";
import {ProfileData} from "@/components/profile/ProfileData.jsx";


export const MediaListPage = () => {
	const { currentUser } = useUser();
	const { mediaType, username } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const [showCommon, setShowCommon] = useState(true);
	const { apiData, loading, error } = useFetchData2(`/list/${mediaType}/${username}`,
		{...Object.fromEntries(searchParams)});

	useEffect(() => {
		setShowCommon(true);
	}, [mediaType]);

	const updateSearchParams = async (updateFn, value) => {
		await setSearchParams({
			...updateFn(value),
			showCommon: showCommon,
		});
	};

	const updateSearch = (search) => ({
		status: "Search",
		search: search,
	});

	const updateStatus = (status) => ({
		status: status,
	});

	const updateGenre = (genre) => ({
		sorting: apiData.pagination.sorting,
		status: apiData.pagination.status,
		genre: genre,
		lang: apiData.pagination.lang,
		search: apiData.pagination.search,
	});

	const updateSorting = (sorting) => ({
		sorting: sorting,
		status: apiData.pagination.status,
		genre: apiData.pagination.genre,
		lang: apiData.pagination.lang,
		search: apiData.pagination.search,
	});

	const updateLang = (lang) => ({
		sorting: apiData.pagination.sorting,
		status: apiData.pagination.status,
		genre: apiData.pagination.genre,
		lang: lang,
		search: apiData.pagination.search,
	});

	const updateLabel = (label) => ({
		status: apiData.pagination.status,
		label_name: label,
	});

	const updatePagination = (page) => ({
		search: apiData.pagination.search,
		sorting: apiData.pagination.sorting,
		status: apiData.pagination.status,
		genre: apiData.pagination.genre,
		lang: apiData.pagination.lang,
		page: page,
	});

	const updateCommon = async () => {
		const data = {
			search: apiData.pagination.search,
			sorting: apiData.pagination.sorting,
			status: apiData.pagination.status,
			genre: apiData.pagination.genre,
			lang: apiData.pagination.lang,
			page: 1,
		}

		await setSearchParams({
			...data,
			showCommon: !showCommon,
		});

		setShowCommon(!showCommon);
	};

	if (error) return <ErrorPage {...error}/>
	if (apiData === undefined || mediaType !== apiData.media_type) return <Loading/>;


	return (
		<PageTitle title={`${username} ${capitalize(mediaType)}List`} onlyHelmet>
			<div className="flex flex-wrap sm:justify-between justify-center items-center gap-6 mt-8">
				<NavigationMediaList
					userData={apiData.user_data}
				/>
				<SearchMediaList
					initSearch={apiData.pagination.search}
					updateSearch={(value) => updateSearchParams(updateSearch, value)}
				/>
				<CommonMediaList
					mediaData={apiData.media_data}
					showCommon={showCommon}
					updateCommon={updateCommon}
				/>
			</div>
			<NavStatusList
				allStatus={apiData.pagination.all_status}
				activeStatus={apiData.pagination.status}
				updateStatus={(value) => updateSearchParams(updateStatus, value)}
			/>
			<div className="flex flex-wrap sm:justify-between justify-center gap-y-1 mt-6">
				<TitleStatusList
					status={apiData.pagination.status}
					total={apiData.pagination.total}
				/>
				<FilterAndSortList
					paginateData={apiData.pagination}
					updateLang={(value) => updateSearchParams(updateLang, value)}
					updateGenre={(value) => updateSearchParams(updateGenre, value)}
					updateSorting={(value) => updateSearchParams(updateSorting, value)}
				/>
			</div>
			<Separator variant="large" className="mb-3"/>
			{apiData.pagination.status === "Stats" ?
				<MediaListStats graphData={apiData.media_data.graph_data}/>
				:
				apiData.pagination.status === "Labels" ?
					<MediaListLabels
						loading={loading}
						mediaData={apiData.media_data}
						isCurrent={currentUser?.username === username}
						updateLabel={(value) => updateSearchParams(updateLabel, value)}
					/>
					:
					<MediaListData
						loading={loading}
						apiData={apiData}
						mediaType={mediaType}
						isCurrent={apiData.user_data.id === currentUser?.id}
						updatePagination={(value) => updateSearchParams(updatePagination, value)}
					/>
			}
		</PageTitle>
	);
};
