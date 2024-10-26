import React from "react";
import {Helmet} from "react-helmet";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";


interface PageTitleProps {
    title: string;
    subtitle?: string;
    onlyHelmet?: boolean;
    children: React.ReactNode;
}


export const PageTitle = ({children, title, subtitle, onlyHelmet = false}: PageTitleProps) => {
    return (
        <>
            <Helmet defer={false}>
                <title>{title} - MyLists</title>
            </Helmet>
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

