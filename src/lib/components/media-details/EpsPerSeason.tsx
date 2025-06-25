import {MediaTitle} from "@/lib/components/media-details/MediaTitle";


interface EpsPerSeasonProps {
    epsPerSeason: {
        season: number,
        episodes: number
    }[];
}


export const EpsPerSeason = ({ epsPerSeason }: EpsPerSeasonProps) => {
    return (
        <div>
            <MediaTitle>Episodes/Seasons</MediaTitle>
            <div className="grid grid-cols-12 gap-3 pr-2 overflow-y-auto max-h-[224px]">
                {epsPerSeason.map((item, idx) =>
                    <div key={idx} className="col-span-4 md:col-span-2 p-2 bg-cyan-900 rounded-md">
                        <div className="font-medium">Season {item.season}</div>
                        <div>{item.episodes} Eps</div>
                    </div>
                )}
            </div>
        </div>
    );
}