import {cn} from "@/lib/utils";


const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-primary/10", className)}
            {...props}
        />
    );
};


export { Skeleton };
