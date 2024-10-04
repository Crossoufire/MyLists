import {cn} from "@/utils/functions";
import {ListData} from "@/components/media-stats/ListData";
import {StatsCard} from "@/components/media-stats/StatsCard";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel";


export const DisplayStats = ({ statsData, otherUserStatsData }) => {
    return (
        <>
            {statsData.cards.isCarouselActive ?
                <Carousel>
                    <CarouselContent>
                        <CarouselItem>
                            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:mt-4">
                                {statsData.cards.dataList.map((data, idx) => {
                                    if (idx >= statsData.cards.cardsPerPage) return;
                                    return (
                                        <StatsCard
                                            key={idx}
                                            data={data}
                                            otherData={otherUserStatsData?.cards.dataList[idx]}
                                        />
                                    );
                                })}
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:mt-4">
                                {statsData.cards.dataList.map((data, idx) => {
                                    if (idx <= statsData.cards.cardsPerPage - 1) return;
                                    return (
                                        <StatsCard
                                            key={idx}
                                            data={data}
                                            otherData={otherUserStatsData?.cards.dataList[idx]}
                                        />
                                    );
                                })}
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious/>
                    <CarouselNext/>
                </Carousel>
                :
                <div className={cn("grid gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:mt-4",
                    statsData.cards.dataList.cardsPerRow === 4 ? "grid-cols-4" : "grid-cols-3")}>
                    {statsData.cards.dataList.map((data, idx) => {
                        return (
                            <StatsCard
                                key={idx}
                                data={data}
                                otherData={otherUserStatsData?.cards.dataList[idx]}
                            />
                        );
                    })}
                </div>
            }
            <div className={cn("grid max-lg:grid-cols-1 max-sm:gap-4 gap-x-6 mt-6",
                statsData.lists.listsPerRow === 3 ? "grid-cols-3" : "grid-cols-2")}>
                {statsData.lists.dataList.map((data, idx) =>
                    <div key={idx} className="mt-2">
                        <ListData
                            key={idx}
                            data={data}
                            asGraph={statsData.lists.asGraph}
                        />
                    </div>
                )}
            </div>
        </>
    );
};