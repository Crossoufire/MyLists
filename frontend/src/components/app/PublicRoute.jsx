import {userClient} from "@/api/MyApiClient";
import {Outlet, useNavigate} from "@tanstack/react-router";


export const PublicRoute = () => {
    const navigate = useNavigate();
    const currentUser = userClient.currentUser;

    if (currentUser === undefined) {
        return null;
    }
    else if (currentUser) {
        return navigate({ to: `/profile/${currentUser.username}` });
    }
    else {
        return <Outlet/>;
    }
};
