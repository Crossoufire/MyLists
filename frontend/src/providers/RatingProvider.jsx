import {createContext, useContext} from "react";


const RatingContext = createContext(null);


export const RatingProvider = ({ value, children }) => (
    <RatingContext.Provider value={value}>
        {children}
    </RatingContext.Provider>
);


export const useRatingSystem = () => useContext(RatingContext);
