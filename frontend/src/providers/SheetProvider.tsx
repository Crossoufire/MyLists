import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useState} from "react";


interface SheetContextType {
    sheetOpen: boolean;
    setSheetOpen: Dispatch<SetStateAction<boolean>>;
}


const SheetContext = createContext<SheetContextType | undefined>(undefined);


export const SheetProvider = ({children}: { children: ReactNode }) => {
    const [sheetOpen, setSheetOpen] = useState<boolean>(false);

    return (
        <SheetContext.Provider value={{sheetOpen, setSheetOpen}}>
            {children}
        </SheetContext.Provider>
    );
};


export const useSheet = (): SheetContextType => {
    const context = useContext(SheetContext);
    if (!context) {
        throw new Error("useSheet must be used within a SheetProvider");
    }
    return context;
};
