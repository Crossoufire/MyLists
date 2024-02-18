import {cn} from "@/lib/utils";
import {Helmet} from "react-helmet";
import {Separator} from "@/components/ui/separator";


export const PageTitle = ({ children, title, subtitle, className, sepClassName, onlyHelmet = false }) => {
    if (onlyHelmet) {
        return (
            <>
                <Helmet><title>{title} - MyLists</title></Helmet>
                {children}
            </>
        );
    }

    return (
        <div className={cn("mt-8 mb-5 flex flex-col mx-auto", className)}>
            <Helmet><title>{title} - MyLists</title></Helmet>
            <div className="text-2xl font-medium">{title}</div>
            <div className="text-base text-muted-foreground">{subtitle}</div>
            <Separator className={sepClassName}/>
            {children}
        </div>
    );
};

