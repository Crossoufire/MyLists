import {api} from "@/api/apiClient";
import {useAuth} from "@/hooks/AuthHook";
import {createFileRoute, Navigate, Outlet} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_private")({
    component: PrivateRoute,
});


function PrivateRoute() {
    const { currentUser } = useAuth();

    if (currentUser === undefined) {
        return null;
    }
    else if (!currentUser || !api.isAuthenticated()) {
        return <Navigate to="/"/>
    }
    return <Outlet/>;
}
