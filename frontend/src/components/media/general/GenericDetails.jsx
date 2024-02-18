
export const GenericDetails = ({name, value, isCentered}) => (
    <div>
        <div className="font-semibold text-neutral-500">{name}</div>
        <div className={isCentered && "text-center"}>{value}</div>
    </div>
);