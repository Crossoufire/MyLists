import {useNavigate} from "react-router-dom";
import {useUser} from "@/providers/UserProvider";


export const PublicRoute = ({ children }) => {
    const navigate = useNavigate();
    const { currentUser } = useUser();

    if (currentUser === undefined) {
        return null;
    } else if (currentUser) {
        return navigate(`/profile/${currentUser.username}`);
    } else {
        return children;
    }
};


