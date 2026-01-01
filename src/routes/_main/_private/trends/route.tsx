import {useState} from "react";
import {LayoutGrid} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {TrendGrid} from "@/lib/client/components/trends/TrendGrid";
import {TrendHero} from "@/lib/client/components/trends/TrendHero";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {trendsOptions} from "@/lib/client/react-query/query-options/query-options";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";


export const Route = createFileRoute("/_main/_private/trends")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(trendsOptions),
    component: TrendsPage,
});


function TrendsPage() {
    const { seriesTrends, moviesTrends } = useSuspenseQuery(trendsOptions).data;
    const [activeTab, setActiveTab] = useState<"all" | typeof MediaType.SERIES | typeof MediaType.MOVIES>("all");

    const allTrends = [...seriesTrends, ...moviesTrends]
        .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    const getFilteredData = () => {
        if (activeTab === MediaType.MOVIES) return moviesTrends;
        if (activeTab === MediaType.SERIES) return seriesTrends;
        return allTrends;
    };

    const filteredTrends = getFilteredData();
    const heroMedia = (activeTab === MediaType.SERIES) ? seriesTrends[0] : moviesTrends[0];
    const mediaTabs: TabItem<"all" | typeof MediaType.SERIES | typeof MediaType.MOVIES>[] = [
        {
            id: "all",
            label: "All",
            isAccent: true,
            icon: <LayoutGrid size={15}/>,
        },
        ...[MediaType.SERIES, MediaType.MOVIES].map((mediaType) => ({
            id: mediaType,
            label: mediaType,
            icon: <MediaAndUserIcon type={mediaType} size={15}/>,
        })),
    ];

    return (
        <PageTitle title="Week Trends" subtitle="Top Series and Movies trending this week according to TMDB">
            <TabHeader
                tabs={mediaTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            <div className="mt-4">
                <TrendHero trend={heroMedia}/>
                <TrendGrid data={filteredTrends}/>
            </div>
        </PageTitle>
    );
}
