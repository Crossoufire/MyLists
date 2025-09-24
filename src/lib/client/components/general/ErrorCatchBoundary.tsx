import React from "react";
import {Skull} from "lucide-react";
import {type ErrorComponentProps,} from "@tanstack/react-router";
import {ErrorComponent} from "@/lib/client/components/general/ErrorComponent";


export function ErrorCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
    console.error({ error });
    
    return (
        <ErrorComponent
            title={"Well, This is Awkward"}
            footerText={"If this keeps happening, we probably broke something important."}
            icon={<Skull className="w-10 h-10 animate-bounce"/>}
            text={"Sorry, it looks like something isn’t working right now. Please try refreshing the page or come back later."}
        />
    );
}
