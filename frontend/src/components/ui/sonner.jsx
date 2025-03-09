import {Toaster as Sonner} from "sonner";


export const Toaster = ({ ...props }) => {
    return (
        <Sonner
            theme={"dark"}
            duration={4000}
            closeButton={false}
            position={"bottom-right"}
            {...props}
        />
    );
};
