import React from "react";
import {MapPin} from "lucide-react";
import {ErrorComponent} from "@/lib/components/general/ErrorComponent";


export function NotFound() {
    return (
        <ErrorComponent
            title={"Page Not Found"}
            footerText={"Need help?"}
            icon={<MapPin className="w-10 h-10 animate-bounce"/>}
            text={"The page you're looking for doesn't exist or has been moved to another location."}
        />
    );
}
