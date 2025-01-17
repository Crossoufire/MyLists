import {cn} from "@/utils/functions";
import {useMediaQuery} from "@/hooks/useMediaQuery";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger} from "@/components/ui/drawer";


const desktop = "(min-width: 768px)";

const Credenza = ({ children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const Credenza = isDesktop ? Dialog : Drawer;
    return <Credenza {...props}>{children}</Credenza>;
};

const CredenzaTrigger = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const CredenzaTrigger = isDesktop ? DialogTrigger : DrawerTrigger;
    return <CredenzaTrigger className={className} {...props}>{children}</CredenzaTrigger>;
};

const CredenzaClose = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const CredenzaClose = isDesktop ? DialogClose : DrawerClose;
    return <CredenzaClose className={className} {...props}>{children}</CredenzaClose>;
};

const CredenzaContent = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const desktopStyle = isDesktop ?
        "w-[400px] min-h-[530px] max-h-[600px] overflow-y-auto overflow-x-hidden"
        :
        "min-h-[583px]";
    const CredenzaContent = isDesktop ? DialogContent : DrawerContent;
    return <CredenzaContent className={cn(desktopStyle, className)} {...props}>{children}</CredenzaContent>;
};

const CredenzaDescription = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const CredenzaDescription = isDesktop ? DialogDescription : DrawerDescription;
    return <CredenzaDescription className={className} {...props}>{children}</CredenzaDescription>;
};

const CredenzaHeader = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const CredenzaHeader = isDesktop ? DialogHeader : DrawerHeader;
    return <CredenzaHeader className={className} {...props}>{children}</CredenzaHeader>;
};

const CredenzaTitle = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const CredenzaTitle = isDesktop ? DialogTitle : DrawerTitle;
    return <CredenzaTitle className={className} {...props}>{children}</CredenzaTitle>;
};

const CredenzaBody = ({ className, children, ...props }) => {
    return <div className={cn("px-4 md:px-0", className)} {...props}>{children}</div>;
};

const CredenzaFooter = ({ className, children, ...props }) => {
    const isDesktop = useMediaQuery(desktop);
    const CredenzaFooter = isDesktop ? DialogFooter : DrawerFooter;
    return <CredenzaFooter className={className} {...props}>{children}</CredenzaFooter>;
};

export {
    Credenza, CredenzaTrigger, CredenzaClose, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle,
    CredenzaBody, CredenzaFooter,
};