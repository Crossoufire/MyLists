import {useAuth} from "@/api";
import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";


export const BlockLink = ({ children, ...props }) => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (ev) => {
        if (currentUser) return;

        if (!props.privacy || props.privacy !== "public") {
            ev.preventDefault();
            setIsOpen(true);
        }
    };

    return (
        <>
            <Link {...props} onClick={handleClick}>
                {children}
            </Link>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-2xl font-bold text-center">Login Required</DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Register or log-in to access this content.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
};

