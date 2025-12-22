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
                <div className="flex flex-col mx-auto mb-8 pt-4">
                    <div>
                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                            {title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>
                    {children}
                </div>
            }
        </>
    );
};
