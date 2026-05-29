import {Store, useSelector} from "@tanstack/react-store";


const authModalStore = new Store<{ view: "login" | "register" | null }>({ view: null });


const authModalActions = {
    close: () => authModalStore.setState(() => ({ view: null })),
    openLogin: () => authModalStore.setState(() => ({ view: "login" })),
    openRegister: () => authModalStore.setState(() => ({ view: "register" })),
};


export const useAuthModal = () => {
    const view = useSelector(authModalStore, (state) => state.view);

    return {
        view,
        isOpen: view !== null,
        ...authModalActions,
    };
};
