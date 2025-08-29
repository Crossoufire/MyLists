import {NameValuePair} from "@/lib/types/base.types";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";


interface StatsTableProps {
    title: string;
    dataList: NameValuePair[] | undefined | null;
}


export const StatsTable = ({ title, dataList }: StatsTableProps) => {
    if (!dataList) return null;

    return (
        <Table>
            <TableHeader>
                <TableRow className="text-base">
                    <TableHead>#</TableHead>
                    <TableHead>{title}</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {dataList.map((item, idx) => (
                    <TableRow key={idx} className="text-base">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.value}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};