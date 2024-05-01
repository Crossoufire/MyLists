import {toast} from "sonner";
import {useUser} from "@/providers/UserProvider";
import {Navigate, Outlet} from "react-router-dom";


export const PrivateRoute = () => {
    const { currentUser } = useUser();

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
