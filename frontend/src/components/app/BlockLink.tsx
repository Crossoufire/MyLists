import {useState} from "react";
import {Privacy} from "@/utils/types.tsx";
import {useAuth} from "@/hooks/AuthHook";
import {Button} from "@/components/ui/button";
import {Link, LinkProps} from "@tanstack/react-router";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";


interface BlockLinkProps extends LinkProps {
    privacy?: Privacy;
}


export const BlockLink = ({children, ...props}: BlockLinkProps) => {
    const {currentUser} = useAuth();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleClick = (ev) => {
        if (currentUser) return;

        if (!props.privacy || props.privacy !== "public") {
            ev.preventDefault();
            setIsOpen(true);
        }
    };

    // @ts-ignore
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
                            Register or log-in to access this content.
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

