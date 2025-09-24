import React from "react";
import {Heart} from "lucide-react";
import {cn} from "@/lib/utils/helpers";


export const DisplayFavorite = ({ isFavorite }: { isFavorite: boolean }) => {
    return <Heart size={15} className={cn("", isFavorite && "text-red-700")}/>;
};
