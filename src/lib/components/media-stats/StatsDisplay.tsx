import {cn} from "@/lib/utils/helpers";
import {StatusBullet} from "@/lib/components/general/StatusBullet";
import {StatsCard} from "@/lib/components/media-stats/StatsCard";
import {StatsList} from "@/lib/components/media-stats/StatsList";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/lib/components/ui/carousel";


export const StatsDisplay = ({ statsData }: { statsData: any }) => {
    return (
        <>
            {statsData.cards.isCarouselActive ?
                <Carousel>
                    <CarouselContent>
                        <CarouselItem>
                            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:mt-4">
                                {statsData.cards.dataList.map((data: any, idx: number) => {
                                    if (idx >= statsData.cards.cardsPerPage) return;
                                    return <StatsCard key={idx} data={data}/>;
                                })}
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:mt-4">
                                {statsData.cards.dataList.map((data: any, idx: number) => {
                                    if (idx <= statsData.cards.cardsPerPage - 1) return;
                                    return <StatsCard key={idx} data={data}/>;
                                })}
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious/>
                    <CarouselNext/>
                </Carousel>
                :
                <div className={cn("grid gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 " +
                    "max-sm:mt-4", statsData.cards.dataList.cardsPerRow === 4 ? "grid-cols-4" : "grid-cols-3")}>
                    {statsData.cards.dataList.map((data: any, idx: number) => <StatsCard key={idx} data={data}/>)}
                </div>
            }
            {statsData.status?.length > 0 &&
                <div className="mt-6">
                    <h2 className="text-xl font-bold mb-2 max-sm:mb-2">Statuses</h2>
                    <div className="flex flex-wrap gap-x-12 gap-y-6">
                        {statsData.status.map((data: any, idx: number) =>
                            <div key={idx} className="flex flex-row items-center justify-start text-lg font-semibold">
                                <StatusBullet
                                    status={data.name}
                                    className="w-[15px] h-[15px] mr-3"
                                />
                                <div>
                                    <div>{data.name}</div>
                                    <div className="text-2xl">{data.value}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            }
            <div className={cn("grid max-lg:grid-cols-1 max-sm:gap-4 gap-6 mt-6",
                statsData.lists.listsPerRow === 3 ? "grid-cols-3" : "grid-cols-2")}>
                {statsData.lists.dataList.map((data: any, idx: number) =>
                    <div key={idx} className="mt-2">
                        <StatsList
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