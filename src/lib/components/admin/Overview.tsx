import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";


export function Overview({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
                <Tooltip/>
                <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary"/>
            </BarChart>
        </ResponsiveContainer>
    )
}
