import React from "react";
import {Skull} from "lucide-react";
import {type ErrorComponentProps} from "@tanstack/react-router";
import {ErrorComponent} from "@/lib/client/components/general/ErrorComponent";
import {PrivateComponent} from "@/lib/client/components/general/PrivateComponent";


export function ErrorCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
    if (!error.message) {
        return (
            <ErrorComponent
                title="Well, This is Awkward"
                icon={<Skull className="size-9"/>}
                footerText="If this keeps happening, we probably broke something important."
                text="Sorry, it looks like something isn’t working right now. Please try refreshing the page or come back later."
            />
        )
    }

    if (error.message === "Unauthorized") {
        return (
            <div className="py-20">
                <PrivateComponent/>
            </div>
        );
    }

    return (
        <ErrorComponent
            text={error.message}
            title="An Error Occurred"
            footerText="If this keeps happening, we probably broke something important."
        />
    );
}
