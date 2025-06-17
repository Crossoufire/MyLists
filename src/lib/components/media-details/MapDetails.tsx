import {Fragment} from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/server/utils/enums";


interface MapDetailsProps {
    name: string;
    job?: string;
    asJoin?: boolean;
    mediaType?: MediaType;
    valueList: Array<any>;
}


export const MapDetails = ({ name, valueList, mediaType, job, asJoin }: MapDetailsProps) => {
    console.log(valueList);

    const renderLink = (value: string | null, idx: number) => (
        //@ts-expect-error
        <Link key={value} to="/details/$mediaType/$job/$value" params={{ mediaType, job, value }}>
            {asJoin ?
                <>
                    <span className="hover:underline hover:underline-offset-2">{value}</span>
                    {idx !== valueList.length - 1 && ", "}
                </>
                :
                <div className="hover:underline hover:underline-offset-2">{value}</div>
            }
        </Link>
    );

    const renderValue = (value: string | null, idx: number) => (
        <Fragment key={value}>
            {asJoin ? <span>{value}{idx !== valueList.length - 1 && ", "}</span> : <div>{value}</div>}
        </Fragment>
    );

    return (
        <div>
            <div className="font-semibold text-neutral-500">{name}</div>
            {(valueList.length === 0 || (valueList.length === 1 && valueList[0] === null)) && "--"}
            {valueList.map((value, idx) =>
                (mediaType && job) ? renderLink(value, idx) : renderValue(value, idx)
            )}
        </div>
    );
};
