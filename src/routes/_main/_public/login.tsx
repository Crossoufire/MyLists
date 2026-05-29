import {toast} from "sonner";
import {createFileRoute, Link} from "@tanstack/react-router";
import {LoginForm} from "@/lib/client/components/auth/LoginForm";
import {PageTitle} from "@/lib/client/components/general/PageTitle";


export const Route = createFileRoute("/_main/_public/login")({
    validateSearch: (search) => search as { message?: string },
    component: LoginPage,
});


function LoginPage() {
    const { message } = Route.useSearch();
    if (message) toast.warning(message);

    return (
        <PageTitle title="Login" onlyHelmet>
            <div className="mt-20 mx-auto w-full max-w-100 border border-neutral-800 rounded-lg p-6 bg-neutral-950 my-10">
                <h1 className="text-2xl font-semibold tracking-tight text-center text-white mb-2">
                    Login to MyLists
                </h1>
                <LoginForm/>
                <div className="mt-6 text-center text-sm text-neutral-400">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="underline text-white hover:text-neutral-200">
                        Register
                    </Link>
                </div>
            </div>
        </PageTitle>
    );
}
