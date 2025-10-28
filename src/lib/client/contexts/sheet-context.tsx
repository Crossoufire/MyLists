import React, {createContext, use, useState} from "react";


interface SheetContextType {
    sheetOpen: boolean;
    setSheetOpen: (open: boolean) => void;
}


const SheetContext = createContext<SheetContextType | undefined>(undefined);


export const SheetProvider = ({ children }: { children: React.ReactNode }) => {
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <SheetContext value={{ sheetOpen, setSheetOpen }}>
            {children}
        </SheetContext>
    );
};


export const useSheet = () => {
    const context = use(SheetContext);
    if (!context) throw new Error("useSheet must be used within a SheetProvider");
    return context;
};
