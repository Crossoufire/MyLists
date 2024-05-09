import {api} from "@/api/MyApiClient";
import {createContext, useState, useEffect, useContext} from "react";


export const UserContext = createContext(undefined);


export const UserProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(undefined);

	useEffect(() => {
		(async () => {
			console.log("entered useEffect");
			if (api.isAuthenticated()) {
				console.log("setup currentUser");
				const response = await api.get("/current_user");
				setCurrentUser(response.ok ? response.body : null);
				console.log("setCurrentUser done", currentUser);
			}
			else {
				setCurrentUser(null);
			}
		})();
	}, [api]);

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
};


export const useUser = () => {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }

    return context;
};
