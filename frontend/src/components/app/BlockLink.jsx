import {useState} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";


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
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Login Required</DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Register or log in to access this content.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button asChild>
                            <Link to={"/"} className="w-full">Register / Login</Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

