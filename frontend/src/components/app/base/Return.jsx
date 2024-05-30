import {cn} from "@/lib/utils";
import {FaCaretLeft} from "react-icons/fa";
import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";


export const Return = ({ value, to, className }) => {
    return (
        <Button variant="link" className={cn("px-0", className)}>
            <Link to={to} className="flex flex-row items-center w-full gap-2 text-base">
                <FaCaretLeft/> Return {value}
            </Link>
        </Button>
    );
};
