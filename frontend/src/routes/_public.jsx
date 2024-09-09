import {createFileRoute, Navigate, Outlet} from "@tanstack/react-router";
import {useAuth} from "@/hooks/AuthHook.jsx";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public")({
    component: PublicRoute,
});


function PublicRoute() {
    const { currentUser } = useAuth();

    if (currentUser === undefined) {
        return null;
    }
    else if (currentUser) {
        return <Navigate to={`/profile/${currentUser.username}`}/>
    }
    return <Outlet/>;
}
