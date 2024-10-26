import {cn} from "@/utils/functions";
import {ReactNode, useState} from "react";
import {LuChevronUp} from "react-icons/lu";


export const useCollapse = (defaultOpen: boolean = true): UseCollapseReturn => {
    const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

    const toggleCollapse = () => {
        setIsOpen((prev) => !prev);
    };

    const caret = (
        <div className={cn("transform transition-transform duration-300", isOpen ? "rotate-0" : "rotate-180")}>
            <LuChevronUp size={21}/>
        </div>
    );

    const contentClasses = cn(
        "transition-all duration-300 ease-in-out",
        isOpen ? "max-h-[900px] opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"
    );

    return {isOpen, caret, toggleCollapse, contentClasses};
};


interface UseCollapseReturn {
    isOpen: boolean;
    caret: ReactNode;
    toggleCollapse: () => void;
    contentClasses: string;
}