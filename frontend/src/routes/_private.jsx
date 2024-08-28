import {api} from "@/api/MyApiClient";
import {useUser} from "@/providers/UserProvider";
import {createFileRoute, Navigate, Outlet} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_private")({
    component: PrivateRoute,
});


function PrivateRoute() {
    const { currentUser } = useUser();

    if (currentUser === undefined) {
        return null;
    }
    else if (!currentUser || !api.isAuthenticated()) {
        return <Navigate to="/"/>
    }
    return <Outlet/>;
}
