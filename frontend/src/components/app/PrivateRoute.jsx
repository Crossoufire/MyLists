import {toast} from "sonner";
import {userClient} from "@/api/MyApiClient";
import {Navigate, Outlet} from "@tanstack/react-router";


export const PrivateRoute = () => {
    const currentUser = userClient.currentUser;

    if (currentUser === undefined) {
        return null;
    }
    else if (currentUser) {
        return <Outlet/>;
    }
    else {
        toast.info("You need to log in before accessing this page.");
        return <Navigate to="/" replace={true}/>;
    }
};
