import {MediaTitle} from "@/components/media-details/MediaTitle";


export const EpsPerSeason = ({ epsPerSeason }) => (
    <div>
        <MediaTitle>Episodes/Seasons</MediaTitle>
        <div className="grid grid-cols-12 gap-3 pr-2 overflow-y-auto max-h-[224px]">
            {epsPerSeason.map((val, idx) =>
                <div key={idx} className="col-span-4 md:col-span-2 p-2 bg-cyan-900 rounded-md">
                    <div className="font-medium">Season {idx + 1}</div>
                    <div>{val} Eps</div>
                </div>
            )}
        </div>
    </div>
);
