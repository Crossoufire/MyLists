import {Toaster as Sonner} from "sonner";
import {useTheme} from "@/providers/ThemeProvider";


const Toaster = ({ ...props }) => {
    const value = useTheme();

    return (
        <Sonner
            theme={value.theme}
            duration={8000}
            closeButton={true}
            {...props}
        />
    );
};


export { Toaster };
