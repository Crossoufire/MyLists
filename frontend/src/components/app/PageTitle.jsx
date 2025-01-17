import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";


export const PageTitle = ({ children, title, subtitle, onlyHelmet = false }) => {
    return (
        <>
            <title>{`${title} - MyLists`}</title>
            {onlyHelmet ?
                children
                :
                <div className="mt-8 mb-5 flex flex-col mx-auto">
                    <div className="text-2xl font-medium">{title}</div>
                    <MutedText className="text-muted-foreground not-italic">{subtitle}</MutedText>
                    <Separator/>
                    {children}
                </div>
            }
        </>
    );
};

