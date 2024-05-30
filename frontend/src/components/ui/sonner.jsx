import {Toaster as Sonner} from "sonner";
import {useTheme} from "@/providers/ThemeProvider";


const Toaster = ({ ...props }) => {
    const value = useTheme();

    return (
        <Sonner
            duration={4000}
            closeButton={true}
            theme={value.theme}
            position={"bottom-right"}
            toastOptions={{closeButton: false}}
            {...props}
        />
    );
};


export { Toaster };
