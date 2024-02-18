import {capitalize} from "@/lib/utils";
import {useEffect, useState} from "react";
import {ErrorPage} from "@/pages/ErrorPage";
import {useUser} from "@/providers/UserProvider";
import {useFetchData2} from "@/hooks/FetchDataHook";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {useParams, useSearchParams} from "react-router-dom";
import {TitleStatus} from "@/components/medialist/TitleStatus";
import {CommonMedia} from "@/components/medialist/CommonMedia";
import {MediaLabels} from "@/components/medialist/MediaLabels";
import {MediaListData} from "@/components/medialist/MediaListData";
import {FilterAndSort} from "@/components/medialist/FilterAndSort";
import {MediaListStats} from "@/components/medialist/MediaListStats";
import {NavigationMedia} from "@/components/medialist/NavigationMedia";
import {SearchMediaList} from "@/components/medialist/SearchMediaList";
import {NavigationStatus} from "@/components/medialist/NavigationStatus";


export const MediaListPage = () => {
	const { currentUser } = useUser();
	const { mediaType, username } = useParams();
	const [showCommon, setShowCommon] = useState(true);
	const [searchParams, setSearchParams] = useSearchParams();
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

	if (error) return <ErrorPage error={error}/>
	if (apiData === undefined || mediaType !== apiData.media_type) return <Loading/>;


	return (
		<PageTitle title={`${username} ${capitalize(mediaType)}List`} onlyHelmet>
			<div className="flex flex-wrap sm:justify-between justify-center items-center gap-6 mt-8">
				<NavigationMedia
					userData={apiData.user_data}
					mediaType={mediaType}
				/>
				<SearchMediaList
					search={apiData.pagination.search}
					updateSearch={(value) => updateSearchParams(updateSearch, value)}
					condition={currentUser?.username === username ? "your" : username}
				/>
				{(currentUser && currentUser?.id !== apiData.user_data.id) &&
					<CommonMedia
						apiData={apiData}
						mediaType={mediaType}
						showCommon={showCommon}
						updateCommon={updateCommon}
					/>
				}
			</div>
			<NavigationStatus
				allStatus={apiData.pagination.all_status}
				activeStatus={apiData.pagination.status}
				updateStatus={(value) => updateSearchParams(updateStatus, value)}
			/>
			<div className="flex flex-wrap sm:justify-between justify-center gap-y-1 mt-6">
				<TitleStatus
					status={apiData.pagination.status}
					total={apiData.pagination.total}
					title={apiData.pagination.title}
				/>
				{!["Stats", "Labels"].includes(apiData.pagination.status) &&
					<FilterAndSort
						mediaType={mediaType}
						paginateData={apiData.pagination}
						updateLang={(value) => updateSearchParams(updateLang, value)}
						updateGenre={(value) => updateSearchParams(updateGenre, value)}
						updateSorting={(value) => updateSearchParams(updateSorting, value)}
					/>
				}
			</div>
			<Separator variant="large" className="mb-3"/>
			{apiData.pagination.status === "Stats" ?
				<MediaListStats
					mediaType={mediaType}
					graphData={apiData.media_data.graph_data}
				/>
				:
				apiData.pagination.status === "Labels" ?
					<MediaLabels
						mediaType={mediaType}
						labels={apiData.media_data.labels}
						labelsMedia={apiData.media_data.labels_media}
						isCurrent={currentUser?.username === username}
						updateLabel={(value) => updateSearchParams(updateLabel, value)}
						loading={loading}
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
