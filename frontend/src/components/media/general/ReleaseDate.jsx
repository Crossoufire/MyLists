
export const ReleaseDate = ({name, start, end}) => {
    return (
        <div>
            <div className="font-semibold text-neutral-500">{name}</div>
            {end ? <div>{start}<br/>{end}</div> : <div>{start}</div>}
        </div>
    );
};
