import React, {createContext, use} from "react";
import {RatingSystemType} from "@/lib/server/utils/enums";


const RatingContext = createContext<RatingSystemType | null>(null);


export const RatingProvider = ({ value, children }: { value: RatingSystemType; children: React.ReactNode }) => (
    <RatingContext value={value}>
        {children}
    </RatingContext>
);


export const useRatingSystem = () => {
    const context = use(RatingContext);
    if (!context) throw new Error("useRatingSystem must be used within a RatingProvider");
    return context;
};
