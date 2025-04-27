import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";


const data = [
    {
        name: "Jan",
        total: 1200,
    },
    {
        name: "Feb",
        total: 1900,
    },
    {
        name: "Mar",
        total: 2400,
    },
    {
        name: "Apr",
        total: 3200,
    },
    {
        name: "May",
        total: 4800,
    },
    {
        name: "Jun",
        total: 5600,
    },
    {
        name: "Jul",
        total: 6400,
    },
    {
        name: "Aug",
        total: 7200,
    },
    {
        name: "Sep",
        total: 8100,
    },
    {
        name: "Oct",
        total: 9400,
    },
    {
        name: "Nov",
        total: 10000,
    },
    {
        name: "Dec",
        total: 10482,
    },
]


export function Overview() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
                <Tooltip/>
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary"/>
            </BarChart>
        </ResponsiveContainer>
    )
}
