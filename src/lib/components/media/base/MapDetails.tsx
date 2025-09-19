import {Fragment} from "react";
import {Link} from "@tanstack/react-router";
import {JobType, MediaType} from "@/lib/server/utils/enums";


interface MapDetailsProps {
    name: string;
    job?: JobType;
    asJoin?: boolean;
    mediaType?: MediaType;
    dataList: { name: string | null }[];
}


export const MapDetails = ({ name, dataList, mediaType, job, asJoin }: MapDetailsProps) => {
    const canRenderLinks = mediaType && job;
    const validItems = dataList.filter((item): item is { name: string } => item.name !== null);
    const shouldShowDashes = dataList.length === 0 || dataList.some(item => item.name === null);

    const renderLink = (item: { name: string }, idx: number) => (
        <Link
            key={item.name}
            to="/details/$mediaType/$job/$name"
            params={{ name: item.name, job: job!, mediaType: mediaType! }}
        >
            {asJoin ?
                <>
                    <span className="hover:underline hover:underline-offset-2">{item.name}</span>
                    {idx !== validItems.length - 1 && ", "}
                </>
                :
                <div className="hover:underline hover:underline-offset-2">{item.name}</div>
            }
        </Link>
    );

    const renderValue = (item: { name: string }, idx: number) => (
        <Fragment key={item.name}>
            {asJoin ?
                <span>
                    {item.name}
                    {idx !== validItems.length - 1 && ", "}
                </span>
                :
                <div>{item.name}</div>
            }
        </Fragment>
    );

    return (
        <div>
            <div className="font-semibold text-neutral-500">
                {name}
            </div>
            {shouldShowDashes ? "-" : validItems.map((item, idx) => canRenderLinks ? renderLink(item, idx) : renderValue(item, idx))}
        </div>
    );
};