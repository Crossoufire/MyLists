import {fetcher} from "@/lib/fetcherLoader.jsx";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {createFileRoute, useLoaderData} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_universal/levels/media_levels")({
    component: MediaLevelsPage,
    loader: async () => fetcher("/levels/media_levels"),
});


function MediaLevelsPage() {
    const apiData = useLoaderData({ strict: false });

    return (
        <PageTitle title="Media levels" subtitle="Understanding the media leveling system: Levels, Grades, and XP">
            <ul className="mt-3 text-lg list-disc ml-10">
                <li>All grades are from the Halo Reach video game.</li>
                <li>50 grades and 150 levels. You gain a grade every 3 levels.</li>
                <li>Levels are based on your total time spent.</li>
                <li>XP = 20*lvl*(1+lvl)</li>
                <li>Level = (&#8730;(400+80*XP)-20)/40</li>
            </ul>
            <div className="mt-8 gap-4 mb-5 grid grid-cols-12">
                {apiData.map((rank, idx) =>
                    <RankCalculus
                        key={idx}
                        rank={rank}
                        loop={idx}
                    />
                )}
            </div>
        </PageTitle>
    );
}


const RankCalculus = ({rank, loop}) => {
    if (loop % 3 === 0) {
        let level, hours;

        level = <div>Lvl {rank.level} +</div>;
        hours = <div>{((20 * rank.level * (1 + rank.level)) / 60)}h +</div>;

        if (rank.level < 147) {
            level = <div>Lvl {rank.level} - Lvl {2+rank.level}</div>;
            hours = <div>{((20 * rank.level*(1+rank.level))/60)}h - {(((20*(3+rank.level))*(4+rank.level))/60)}h</div>;
        }

        return (
            <div className="col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-2">
                <div className="bg-card h-100 rounded-md flex flex-col justify-center items-center p-2">
                    <img
                        src={rank.image}
                        className="w-11 h-11"
                        alt={rank.name}
                    />
                    <div className="text-muted-foreground mb-2 mt-1 text-center">{rank.name}</div>
                    <div className="text-center">{level}{hours}</div>
                </div>
            </div>
        )
    }
};