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

    const login = async (username, password) => {
        const response = await api.login(username, password);
        if (response.ok) {
            const response = await api.get("/current_user");
            setCurrentUser(response.ok ? response.body : null);
        }
        return response;
    };

    const oAuth2Login = async (provider, data) => {
        const response = await api.oAuth2Login(provider, data);
        if (response.ok) {
            const response = await api.get("/current_user");
            setCurrentUser(response.ok ? response.body : null);
        }
        return response;
    };

    const logout = async () => {
        await api.logout();
        setCurrentUser(null);
    };

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser, login, oAuth2Login, logout }}>
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
