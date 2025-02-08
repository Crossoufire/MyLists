import {createContext, useContext, useEffect, useState} from "react";


const initialState = { theme: "dark", setTheme: () => null };

const ThemeProviderContext = createContext(initialState);


export function ThemeProvider({ children, defaultTheme = "dark", storageKey = "vite-ui-theme", ...props }) {
    const [theme, setTheme] = useState(() => (localStorage.getItem(storageKey) || defaultTheme));

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
            return;
        }

        // noinspection JSCheckFunctionSignatures
        root.classList.add(theme);
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    // noinspection JSValidateTypes
    return (
        (<ThemeProviderContext {...props} value={value}>
            {children}
        </ThemeProviderContext>)
    );
}


export const useTheme = () => {
    const context = useContext(ThemeProviderContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
