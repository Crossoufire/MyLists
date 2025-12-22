import {PrivacyType} from "@/lib/utils/enums";
import React, {ReactNode, useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Link, LinkProps} from "@tanstack/react-router";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


interface BlockLinkProps extends LinkProps {
    className?: string;
    children: ReactNode;
    privacy?: PrivacyType;
    style?: React.CSSProperties;
}


export const BlockLink = ({ children, ...props }: BlockLinkProps) => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (ev: React.MouseEvent<HTMLAnchorElement>) => {
        if (currentUser) return;

        if (!props.privacy || props.privacy !== PrivacyType.PUBLIC) {
            ev.preventDefault();
            setIsOpen(true);
        }
    };

    return (
        <>
            <Link {...props} onClick={handleClick} className="hover:text-app-accent">
                {children}
            </Link>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-100">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-2xl font-bold text-center">
                            Login Required
                        </DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Register or log-in to access this content.
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
};
