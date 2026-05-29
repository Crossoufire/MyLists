import {useAuthModal} from "@/lib/client/hooks/use-auth-modal";
import {LoginForm} from "@/lib/client/components/auth/LoginForm";
import {RegisterForm} from "@/lib/client/components/auth/RegisterForm";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


export function AuthModalProvider() {
    const { view, isOpen, close } = useAuthModal();

    return (
        <>
            <LoginModal
                onOpenChange={close}
                open={isOpen && view === "login"}
            />
            <RegisterModal
                onOpenChange={close}
                open={isOpen && view === "register"}
            />
        </>
    );
}


interface LoginModalProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}


function LoginModal({ open, onOpenChange }: LoginModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-sm:w-full w-87 bg-neutral-950">
                <DialogHeader>
                    <DialogTitle>Login to MyLists</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <LoginForm
                    onOpenChange={onOpenChange}
                />
            </DialogContent>
        </Dialog>
    )
}


interface RegisterModalProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}


function RegisterModal({ open, onOpenChange }: RegisterModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-sm:w-full w-87 bg-neutral-950">
                <DialogHeader>
                    <DialogTitle>Register to MyLists</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <RegisterForm
                    onOpenChange={onOpenChange}
                />
            </DialogContent>
        </Dialog>
    )
}
