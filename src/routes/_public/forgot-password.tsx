import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/components/general/PageTitle";


export const Route = createFileRoute("/_public/forgot-password")({
    component: ForgotPassword,
})


function ForgotPassword() {
    return (
        <PageTitle title="Forgot Password">
            <h4 className="text-xl font-semibold mb-1 mt-6">Forgot Password</h4>
        </PageTitle>
    )
}
