import {useState} from "react";
import {FaCaretDown, FaCaretRight} from "react-icons/fa";


export const useCollapse = (initPos = true) => {
    const [isOpen, setIsOpen] = useState(initPos);
    const [caret, setCaret] = useState(initPos ? <FaCaretRight size={21}/> : <FaCaretDown size={21}/>);

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
        isOpen ? setCaret(<FaCaretDown size={21}/>) : setCaret(<FaCaretRight size={21}/>);
    };

    return { isOpen, caret, toggleCollapse };
};
