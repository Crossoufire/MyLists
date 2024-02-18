import {Select, SelectTrigger, SelectContent, SelectItem} from "@/components/ui/select";


export const FilterSortDrop = ({ name, activeData, allData, updateFunction }) => {
    const handleChange = (value) => {
        updateFunction(value);
    }

    return (
        <Select value={activeData} onValueChange={handleChange}>
            <SelectTrigger className="w-full">
                <div className="font-medium">{name} &nbsp;&#8226;&nbsp; {activeData}</div>
            </SelectTrigger>
            <SelectContent>
                {allData.map(data => <SelectItem key={data} value={data}>{data}</SelectItem>)}
            </SelectContent>
        </Select>
    )
};