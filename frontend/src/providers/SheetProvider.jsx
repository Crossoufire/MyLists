import {createContext, use, useState} from "react";


const SheetContext = createContext(undefined);


export const SheetProvider = ({ children }) => {
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        (<SheetContext value={{ sheetOpen, setSheetOpen }}>
            {children}
        </SheetContext>)
    );
};


export const useSheet = () => {
    const context = use(SheetContext);
    if (!context) {
        throw new Error("useSheet must be used within a SheetProvider");
    }
    return context;
};
