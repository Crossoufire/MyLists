import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";


export const StatsTable = ({title, dataList}: StatsTableProps) => {
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
                {dataList.map((data, idx) => (
                    <TableRow key={idx} className="text-base">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell title={data.name}>{data.name}</TableCell>
                        <TableCell>{data.value}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


interface StatsTableProps {
    title: string;
    dataList: Array<{ name: string; value: string | number }>;
}