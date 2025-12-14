import {Timeframe} from "@/lib/client/social-card/types";
import {Card, CardContent} from "@/lib/client/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface TimeframeSelectorProps {
    timeframe: Timeframe;
    onChange: (timeframe: Timeframe) => void;
}


const CURRENT_YEAR = new Date().getFullYear();


export function TimeframeSelector({ timeframe, onChange }: TimeframeSelectorProps) {
    return (
        <Card>
            <CardContent>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                        Timeframe
                    </h2>
                </div>
                <Select value={timeframe} onValueChange={(v) => onChange(v as Timeframe)}>
                    <SelectTrigger className="w-full">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="year">{CURRENT_YEAR}</SelectItem>
                        <SelectItem value="alltime">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
}
