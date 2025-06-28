import {useSuspenseQuery} from "@tanstack/react-query";
import {SearchType} from "@/lib/server/types/base.types";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {Pagination} from "@/lib/components/app/Pagination";
import {JobType, MediaType} from "@/lib/server/utils/enums";
import {MediaCard} from "@/lib/components/media/base/MediaCard";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {MediaCornerCommon} from "@/lib/components/media/base/MediaCornerCommon";
import {jobDetailsOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/details/$mediaType/$job/$name")({
    params: {
        parse: (params) => {
            return { job: params.job as JobType, name: params.name as string, mediaType: params.mediaType as MediaType }
        }
    },
    validateSearch: (search) => search as SearchType,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { mediaType, job, name }, deps: { search } }) => {
        return queryClient.ensureQueryData(jobDetailsOptions(mediaType, job, name, search));
    },
    component: JobInfoPage,
});


const DEFAULT = { page: 1 };


function JobInfoPage() {
    const filters = Route.useSearch();
    const { mediaType, job, name } = Route.useParams();
    const navigate = useNavigate({ from: "/details/$mediaType/$job/$name" });
    const apiData = useSuspenseQuery(jobDetailsOptions(mediaType, job, name, filters)).data;
    const { page = DEFAULT.page } = filters;

    const onPageChange = async (page: number) => {
        await navigate({ search: { page } });
    };

    return (
        <PageTitle title={`${name}'s ${mediaType} (${apiData.total})`}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-6 sm:gap-5">
                {apiData.items.map((item) => (
                    <div key={item.mediaId} className="col-span-1">
                        <MediaCard item={item} mediaType={mediaType}>
                            {item.inUserList &&
                                <MediaCornerCommon isCommon={item.inUserList}/>
                            }
                        </MediaCard>
                    </div>
                ))}
            </div>
            <Pagination
                currentPage={page}
                totalPages={apiData.pages}
                onChangePage={onPageChange}
            />
        </PageTitle>
    );
}
