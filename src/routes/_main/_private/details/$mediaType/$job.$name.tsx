import {Check} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {capitalize} from "@/lib/utils/functions";
import {JobType, MediaType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {SearchType} from "@/lib/types/zod.schema.types";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {jobDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {MediaCornerCommon} from "@/lib/client/components/media/base/MediaCornerCommon";


export const Route = createFileRoute("/_main/_private/details/$mediaType/$job/$name")({
    params: {
        parse: (params) => {
            return {
                job: params.job as JobType,
                name: params.name as string,
                mediaType: params.mediaType as MediaType,
            }
        }
    },
    validateSearch: (search) => search as SearchType,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { mediaType, job, name }, deps: { search } }) => {
        return queryClient.ensureQueryData(jobDetailsOptions(mediaType, job, name, search));
    },
    component: JobInfoPage,
});


const DEFAULT = { page: 1 } satisfies SearchType;


function JobInfoPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { mediaType, job, name } = Route.useParams();
    const apiData = useSuspenseQuery(jobDetailsOptions(mediaType, job, name, filters)).data;
    const { page = DEFAULT.page } = filters;

    const onPageChange = async (page: number) => {
        await navigate({ search: { page } });
    };

    return (
        <PageTitle
            title={`${name}'s ${capitalize(mediaType)}`}
            subtitle={`Found ${apiData.total} titles across ${apiData.pages} pages`}
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-4 mt-6">
                {apiData.items.map((item) =>
                    <Link to="/details/$mediaType/$mediaId" params={{ mediaType, mediaId: item.mediaId }} search={{ external: false }}>
                        <div key={item.mediaId} className="group relative flex flex-col gap-2 transition-all duration-300">
                            <div className="relative aspect-2/3 overflow-hidden rounded-lg border hover:border-zinc-600
                            transition-all duration-300">
                                <img
                                    loading="lazy"
                                    alt={item.mediaName}
                                    src={item.imageCover}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
                                />

                                <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-transparent to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

                                <div className="absolute bottom-3 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <h3 className="font-medium text-xs leading-tight truncate">
                                        {item.mediaName}
                                    </h3>
                                </div>

                                {item.inUserList &&
                                    <MediaCornerCommon
                                        isCommon={item.inUserList}
                                    />
                                }
                            </div>
                        </div>
                    </Link>
                )}
            </div>
            <Pagination
                currentPage={page}
                totalPages={apiData.pages}
                onChangePage={onPageChange}
            />
        </PageTitle>
    );
}
