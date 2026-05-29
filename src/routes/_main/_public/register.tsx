import {toast} from "sonner";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {RegisterForm} from "@/lib/client/components/auth/RegisterForm";


export const Route = createFileRoute("/_main/_public/register")({
    validateSearch: (search) => search as { message?: string },
    component: RegisterPage,
});


function RegisterPage() {
    const { message } = Route.useSearch();
    if (message) toast.warning(message);

    return (
        <PageTitle title="Register" onlyHelmet>
            <div className="mt-20 mx-auto w-full max-w-100 border border-neutral-800 rounded-lg p-6 bg-neutral-950 my-10">
                <h1 className="text-2xl font-semibold tracking-tight text-center text-white mb-2">
                    Register to MyLists
                </h1>
                <RegisterForm/>
                <div className="mt-6 text-center text-sm text-neutral-400">
                    Already have an account?{" "}
                    <Link to="/login" className="underline text-white hover:text-neutral-200">
                        Sign-in
                    </Link>
                </div>
            </div>
        </PageTitle>
    );
}
