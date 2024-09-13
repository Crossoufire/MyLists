import {useAuth} from "@/hooks/AuthHook";
import {createFileRoute, Navigate, Outlet} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public")({
    component: PublicRoute,
});


function PublicRoute() {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }
    else if (currentUser !== null && currentUser !== undefined) {
        return <Navigate to={`/profile/${currentUser.username}`}/>;
    }

    return <Outlet/>;
}
