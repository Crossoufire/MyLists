import {useUser} from "@/providers/UserProvider";
import {Outlet, useNavigate} from "react-router-dom";


export const PublicRoute = () => {
    const navigate = useNavigate();
    const { currentUser } = useUser();

    if (currentUser === undefined) {
        return null;
    }
    else if (currentUser) {
        return navigate(`/profile/${currentUser.username}`);
    }
    else {
        return <Outlet/>;
    }
};


