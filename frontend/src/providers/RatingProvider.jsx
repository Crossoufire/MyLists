import {createContext, use} from "react";


const RatingContext = createContext(null);


export const RatingProvider = ({ value, children }) => (
    <RatingContext value={value}>
        {children}
    </RatingContext>
);


export const useRatingSystem = () => use(RatingContext);
