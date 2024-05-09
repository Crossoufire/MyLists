import {toast} from "sonner";
import {capitalize} from "@/lib/utils";
import {useEffect, useState} from "react";
import {fetcher} from "@/hooks/FetchDataHook";
import {api, userClient} from "@/api/MyApiClient";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/app/base/Loading";
import {NavStatusList} from "@/components/medialist/NavStatusList";
import {MediaListData} from "@/components/medialist/MediaListData";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {SearchMediaList} from "@/components/medialist/SearchMediaList";
import {CommonMediaList} from "@/components/medialist/CommonMediaList";
import {TitleStatusList} from "@/components/medialist/TitleStatusList";
import {MediaListLabels} from "@/components/medialist/MediaListLabels";
import {FilterAndSortList} from "@/components/medialist/FilterAndSortList";
import {NavigationMediaList} from "@/components/medialist/NavigationMediaList";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/list/$mediaType/$username")({
    component: MediaListPage,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ params, deps }) => fetcher(`/list/${params.mediaType}/${params.username}`, deps.search),
});


function MediaListPage() {
    const navigate = useNavigate();
    const data = Route.useLoaderData();
    const searchParams = Route.useSearch();
    const currentUser = userClient.currentUser;
    const [apiData, setApiData] = useState(data);
    const { mediaType, username } = Route.useParams();
    const [loading, setLoading] = useState(false);
    const [showCommon, setShowCommon] = useState(true);

    useEffect(() => {
        setApiData(data);
        setShowCommon(true);
    }, [mediaType]);

    const fetchMedia = async (search) => {
        setLoading(true);
        const response = await api.get(`/list/${mediaType}/${username}`, search);
        setLoading(false);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        setApiData(response.body.data);
    };

    const updateSearchParams = async (updateFn, value) => {
        await fetchMedia({ ...searchParams, ...updateFn(value), showCommon });
        // noinspection JSCheckFunctionSignatures
        await navigate({ search: () => ({ ...updateFn(value), showCommon }) });
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
        };
        await fetchMedia({ ...searchParams, ...data, showCommon: !showCommon });
        // noinspection JSCheckFunctionSignatures
        await navigate({ search: (prev) => ({ ...prev, ...data, showCommon: !showCommon }) });
        setShowCommon(!showCommon);
    };

    if (apiData.media_type !== mediaType) return <Loading/>;

    console.log(apiData);

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
                    title={apiData.pagination.title}
                />
                <FilterAndSortList
                    paginateData={apiData.pagination}
                    updateLang={(value) => updateSearchParams(updateLang, value)}
                    updateGenre={(value) => updateSearchParams(updateGenre, value)}
                    updateSorting={(value) => updateSearchParams(updateSorting, value)}
                />
            </div>
            <Separator variant="large" className="mb-3"/>
            {apiData.pagination.status === "Labels" ?
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
                    isCurrent={apiData.user_data.id === currentUser.id}
                    updatePagination={(value) => updateSearchParams(updatePagination, value)}
                />
            }
        </PageTitle>
    );
}