import {MediaType} from "@/lib/utils/enums";
import {BookOpen, Plus} from "lucide-react";
import {capitalize} from "@/lib/utils/formating";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {createFileRoute, Link} from "@tanstack/react-router";
import {CommunitySearch} from "@/lib/types/collections.types";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {SearchInput} from "@/lib/client/components/general/SearchInput";
import {useSearchNavigate} from "@/lib/client/hooks/use-search-navigate";
import {CollectionCard} from "@/lib/client/components/collections/CollectionCard";
import {communityCollectionsOptions} from "@/lib/client/react-query/query-options/query-options";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


export const Route = createFileRoute("/_main/_private/collections/discover")({
    validateSearch: (search) => search as CommunitySearch,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(communityCollectionsOptions(search));
    },
    component: CollectionsDiscoverPage,
});


const DEFAULT = { page: 1, search: "" } satisfies CommunitySearch;


function CollectionsDiscoverPage() {
    const filters = Route.useSearch();
    const { page = DEFAULT.page, search = DEFAULT.search, mediaType } = filters;
    const apiData = useSuspenseQuery(communityCollectionsOptions(filters)).data;
    const { localSearch, handleInputChange, updateFilters } = useSearchNavigate<CommunitySearch>({ search });

    return (
        <PageTitle title="Community collections" subtitle="Public collections created and shared by the community.">
            <div className="space-y-10">
                <div className="space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3 gap-y-2">
                            <SearchInput
                                className="w-60"
                                value={localSearch}
                                onChange={handleInputChange}
                                placeholder="Search collections..."
                            />
                            <Select
                                value={mediaType ?? "all"}
                                onValueChange={(val) => updateFilters({ page: 1, mediaType: val === "all" ? undefined : val as MediaType })}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {Object.values(MediaType).map((type) =>
                                        <SelectItem key={type} value={type}>
                                            {capitalize(type)}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button asChild>
                            <Link to="/collections/create">
                                <Plus className="size-4"/> New collection
                            </Link>
                        </Button>
                    </div>

                    {apiData.items.length === 0 ?
                        <EmptyState
                            iconSize={40}
                            icon={BookOpen}
                            className="py-20"
                            message={`No public collections found${search ? ` for '${search}'` : ""}.`}
                        />
                        :
                        <div className="grid gap-4 gap-y-7 grid-cols-3 pt-4 max-sm:grid-cols-1">
                            {apiData.items.map((collection) =>
                                <CollectionCard
                                    key={collection.id}
                                    collection={collection}
                                />
                            )}
                        </div>
                    }
                    <Pagination
                        currentPage={page}
                        totalPages={apiData.pages}
                        onChangePage={(nextPage) => updateFilters({ page: nextPage })}
                    />
                </div>
            </div>
        </PageTitle>
    );
}
