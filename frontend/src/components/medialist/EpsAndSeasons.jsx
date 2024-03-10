import {useState} from "react";
import {zeroPad} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {Separator} from "@/components/ui/separator";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


// TODO: Separate the loading state between episodes and seasons

export const EpsAndSeasons = ({ isCurrent, initSeason, initEpisode, epsPerSeason, updateSeas, updateEps }) => {
    const [isLoading, handleLoading] = useLoading();
    const [currentEps, setCurrentEps] = useState(initEpisode || "1");
    const [currentSeas, setCurrentSeas] = useState(initSeason || "1");
    const seasons = [...Array(epsPerSeason.length).keys()].map(v => v + 1);
    const episodes = [...Array(epsPerSeason[currentSeas - 1]).keys()].map(v => v + 1);

    const handleSeason = async (value) => {
        const newVal = parseInt(value);
        const response = await handleLoading(updateSeas, newVal);

        if (response) {
            setCurrentSeas(newVal);
            setCurrentEps(1);
        }
    }

    const handleEpisode = async (value) => {
        const newVal = parseInt(value);
        const response = await handleLoading(updateEps, newVal);

        if (response) {
            setCurrentEps(newVal);
        }
    }

    return (
        <>
            {isCurrent ?
                <div className="flex justify-center items-center h-[32px] w-full opacity-90 bg-gray-900 border
                border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
                    <Select value={isLoading ? undefined : currentSeas} onValueChange={handleSeason} disabled={isLoading}>
                        <SelectTrigger className="w-36" variant="noIcon" size="list">
                            <SelectValue placeholder={<LoadingIcon size={5}/>}/>
                        </SelectTrigger>
                        <SelectContent>
                            {seasons.map(s => <SelectItem value={s}>S{zeroPad(s)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Separator orientation="vertical" variant="vertical"/>
                    <Select value={isLoading ? undefined : currentEps} onValueChange={handleEpisode} disabled={isLoading}>
                        <SelectTrigger className="w-36 text-base" size="list" variant="noIcon">
                            <SelectValue placeholder={<LoadingIcon size={5}/>}/>
                        </SelectTrigger>
                        <SelectContent>
                            {episodes.map(e => <SelectItem value={e}>E{zeroPad(e)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                :
                <div className="flex justify-evenly items-center h-[32px] w-full opacity-90 bg-gray-900 border
                border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
                    <div>S{zeroPad(currentSeas)}</div>
                    <Separator orientation="vertical" variant="vertical"/>
                    <div>E{zeroPad(currentEps)}</div>
                </div>
            }
        </>
    )
};
