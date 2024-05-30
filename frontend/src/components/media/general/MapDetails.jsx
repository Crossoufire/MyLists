import {Fragment} from "react";
import {Link} from "@tanstack/react-router";


export const MapDetails = ({ name, valueList, mediaType, job, asJoin }) => {
    const renderLink = (value) => (
        <Link key={value} to={`/details/${mediaType}/${job}/${value}`}>
            <div className="hover:underline hover:underline-offset-2">{value}</div>
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
            {valueList.map((value, idx) =>
                (mediaType && job && value !== "Unknown") ? renderLink(value) : renderValue(value, idx)
            )}
        </div>
    );
};
