import {useUser} from "@/providers/UserProvider";
import {createFileRoute, Navigate, Outlet} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public")({
    component: PublicRoute,
});


function PublicRoute() {
    const { currentUser } = useUser();

    if (currentUser === undefined) {
        return null;
    }
    else if (currentUser) {
        return <Navigate to={`/profile/${currentUser.username}`}/>
    }
    return <Outlet/>;
}
