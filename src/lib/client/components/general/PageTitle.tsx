import React from "react";
import {Separator} from "@/lib/client/components/ui/separator";
import {MutedText} from "@/lib/client/components/general/MutedText";


interface PageTitleProps {
    title: string;
    subtitle?: string;
    onlyHelmet?: boolean;
    children?: React.ReactNode;
}


export const PageTitle = ({ children, title, subtitle, onlyHelmet = false }: PageTitleProps) => {
    return (
        <>
            <title>{`${title} - MyLists`}</title>
            {onlyHelmet ?
                children
                :
                <div className="mt-8 mb-5 flex flex-col mx-auto">
                    <div className="text-2xl font-medium">{title}</div>
                    <MutedText className="text-muted-foreground" italic={false}>
                        {subtitle}
                    </MutedText>
                    <Separator className="mt-0.5 mb-3"/>
                    {children}
                </div>
            }
        </>
    );
};

