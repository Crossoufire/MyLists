import React, {createContext, use} from "react";


interface RatingContextType {
    rating: number;
    setRating: (rating: number) => void;
}


const RatingContext = createContext<RatingContextType | null>(null);


export const RatingProvider = ({ value, children }: { value: RatingContextType; children: React.ReactNode }) => (
    <RatingContext value={value}>
        {children}
    </RatingContext>
);


export const useRatingSystem = () => {
    const context = use(RatingContext);
    if (!context) throw new Error("useRatingSystem must be used within a RatingProvider");
    return context;
};
