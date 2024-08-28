import {api} from "@/api/MyApiClient";
import {createContext, useContext, useEffect, useState} from "react";


const UserContext = createContext(null);


export function UserProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(undefined);

    useEffect(() => {
        (async () => {
            if (api.isAuthenticated()) {
                const response = await api.get("/current_user");
                setCurrentUser(response.ok ? response.body : null);
            }
            else {
                setCurrentUser(null);
            }
        })();
    }, []);

    const login = async (usernameOrProvider, passwordOrProviderData, oAuth2 = false) => {
        const logging = await api.login(usernameOrProvider, passwordOrProviderData, oAuth2);
        if (logging.ok) {
            const response = await api.get("/current_user");
            setCurrentUser(response.ok ? response.body : null);
        }
        return logging;
    };

    const logout = async () => {
        await api.logout();
        setCurrentUser(null);
    };

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}


export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within an UserProvider")
    }
    return context;
};
