import {Fragment} from "react";
import {Link} from "@tanstack/react-router";


export const MapDetails = ({ name, valueList, mediaType, job, asJoin }) => {
    const renderLink = (value, idx) => (
        <Link key={value} to={`/details/${mediaType}/${job}/${value}`}>
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

    const renderValue = (value, idx) => (
        <Fragment key={value}>
            {asJoin ? <span>{value}{idx !== valueList.length - 1 && ", "}</span> : <div>{value}</div>}
        </Fragment>
    );

    return (
        <div>
            <div className="font-semibold text-neutral-500">{name}</div>
            {valueList.length === 0 && "--"}
            {valueList.map((value, idx) =>
                (mediaType && job && value !== "Unknown") ? renderLink(value, idx) : renderValue(value, idx)
            )}
        </div>
    );
};
