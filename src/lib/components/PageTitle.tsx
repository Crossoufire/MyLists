import React from "react";
import {MutedText} from "@/lib/components/MutedText";
import {Separator} from "@/lib/components/ui/separator";


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
                    <MutedText className="text-muted-foreground not-italic">{subtitle}</MutedText>
                    <Separator/>
                    {children}
                </div>
            }
        </>
    );
};

