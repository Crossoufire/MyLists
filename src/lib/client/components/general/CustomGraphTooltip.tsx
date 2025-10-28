import {formatNumberWithKM} from "@/lib/utils/functions";


interface CustomGraphTooltipProps {
    label?: string;
    payload?: any[];
    active?: boolean;
}


export const CustomGraphTooltip = ({ active, payload, label }: CustomGraphTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 p-2 rounded-md">
                <p>Label: {`${label}`}</p>
                <p>Value: {`${formatNumberWithKM(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
};
