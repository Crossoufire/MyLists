import {Helmet} from "react-helmet";
import {Separator} from "@/components/ui/separator.jsx";


export const PageTitle = ({ children, title, subtitle, onlyHelmet = false }) => {
    return (
        <>
            <Helmet defer={false}><title>{title} - MyLists</title></Helmet>
            {onlyHelmet ?
                children
                :
                <div className="mt-8 mb-5 flex flex-col mx-auto">
                    <div className="text-2xl font-medium">{title}</div>
                    <div className="text-base text-muted-foreground">{subtitle}</div>
                    <Separator/>
                    {children}
                </div>
            }
        </>
    );
};

