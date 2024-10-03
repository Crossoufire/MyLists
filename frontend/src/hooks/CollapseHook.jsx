import {useState} from "react";
import {cn} from "@/utils/functions";
import {LuChevronUp} from "react-icons/lu";


export const useCollapse = (defaultOpen = true) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
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

    return { isOpen, caret, toggleCollapse, contentClasses };
};
