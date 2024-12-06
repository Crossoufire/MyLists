import {createContext, useContext, useState} from "react";


const SheetContext = createContext(undefined);


export const SheetProvider = ({ children }) => {
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <SheetContext.Provider value={{ sheetOpen, setSheetOpen }}>
            {children}
        </SheetContext.Provider>
    );
};


export const useSheet = () => {
    const context = useContext(SheetContext);
    if (!context) {
        throw new Error("useSheet must be used within a SheetProvider");
    }
    return context;
};
