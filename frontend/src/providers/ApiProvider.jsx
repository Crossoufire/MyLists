import {MyApiClient} from "../api/MyApiClient";
import {createContext, useContext} from "react";


export const ApiContext = createContext(undefined);


export const ApiProvider = ({ children }) => {
	const api = new MyApiClient();

	return (
		<ApiContext.Provider value={api}>
			{children}
		</ApiContext.Provider>
	);
};


export const useApi = () => useContext(ApiContext);
