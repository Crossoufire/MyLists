interface GenericDetailsProps {
    value: any;
    name: string;
}


export const GenericDetails = ({ name, value }: GenericDetailsProps) => (
    <div>
        <div className="font-semibold text-neutral-500">{name}</div>
        <div>{value ? value : "--"}</div>
    </div>
);