import {toast} from "sonner";
import {useNavigate} from "react-router-dom";
import {useUser} from "@/providers/UserProvider";


export const PrivateRoute = ({ children }) => {
    const navigate = useNavigate();
    const { currentUser } = useUser();

    if (currentUser === undefined) {
        return null;
    } else if (currentUser) {
        return children;
    } else {
        toast.info("You need to log in before accessing this page.");
        navigate("/", { replace: true });
        return null;
    }
};
