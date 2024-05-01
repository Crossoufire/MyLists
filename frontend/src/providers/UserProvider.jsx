import {useNavigate} from "react-router-dom";
import {useApi} from "@/providers/ApiProvider";
import {createContext, useState, useEffect, useContext} from "react";


export const UserContext = createContext(undefined);


export const UserProvider = ({ children }) => {
	const api = useApi();
	const navigate = useNavigate();
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
		return navigate("/", { replace: true });
	};

	return (
		<UserContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
			{children}
		</UserContext.Provider>
	);
};


export const useUser = () => useContext(UserContext);