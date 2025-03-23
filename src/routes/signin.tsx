import {cn} from "@/lib/utils/helpers";
import type {ComponentProps} from "react";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {createFileRoute, redirect} from "@tanstack/react-router";


export const Route = createFileRoute("/signin")({
    component: AuthPage,
    beforeLoad: async ({ context }) => {
        if (context.user) {
            throw redirect({
                to: "/dashboard",
            });
        }
    },
});


function AuthPage() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-8 rounded-xl border bg-card p-10">
                Logo here
                <div className="flex flex-col gap-2">
                    <SignInButton
                        provider="discord"
                        label="Discord"
                        className="bg-[#5865F2] hover:bg-[#5865F2]/80"
                    />
                    <SignInButton
                        provider="github"
                        label="GitHub"
                        className="bg-neutral-700 hover:bg-neutral-700/80"
                    />
                    <SignInButton
                        provider="google"
                        label="Google"
                        className="bg-[#DB4437] hover:bg-[#DB4437]/80"
                    />
                </div>
            </div>
        </div>
    );
}


interface SignInButtonProps extends ComponentProps<typeof Button> {
    provider: "discord" | "google" | "github";
    label: string;
}


function SignInButton({ provider, label, className, ...props }: SignInButtonProps) {
    return (
        <Button
            onClick={() =>
                authClient.signIn.social({ provider, callbackURL: "/dashboard" })
            }
            type="button"
            size="lg"
            className={cn("text-white hover:text-white", className)}
            {...props}
        >
            Sign in with {label}
        </Button>
    );
}
