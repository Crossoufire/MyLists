export const GenericDetails = ({ name, value }) => (
    <div>
        <div className="font-semibold text-neutral-500">{name}</div>
        <div>{value ? value : "--"}</div>
    </div>
);