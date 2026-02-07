import {cn} from "@/lib/utils/helpers";
import {PrivacyType} from "@/lib/utils/enums";
import React, {ReactNode, useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Link, LinkProps} from "@tanstack/react-router";
import {LoginForm} from "@/lib/client/components/auth/LoginForm";


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
        // @ts-expect-error - Ok
        props.onClick?.(ev);
        if (ev.defaultPrevented || currentUser) return;

        if (!props.privacy || props.privacy !== PrivacyType.PUBLIC) {
            ev.preventDefault();
            setIsOpen(true);
        }
    };

    return (
        <>
            <Link {...props} onClick={handleClick} className={cn("hover:text-app-accent", props.className)}>
                {children}
            </Link>

            <LoginForm
                open={isOpen}
                onOpenChange={setIsOpen}
                contextMessage="To access this content, please log in."
            />
        </>
    );
};
