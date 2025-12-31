import React from "react";
import {Status} from "@/lib/utils/enums";
import {Badge} from "@/lib/client/components/ui/badge";
import {getStatusColor, getTextColor} from "@/lib/utils/functions";


export const StatusBadge = ({ status }: { status: Status }) => {
    return (
        <Badge style={{ background: getStatusColor(status), color: getTextColor(getStatusColor(status)) }}>
            {status}
        </Badge>
    );
};
