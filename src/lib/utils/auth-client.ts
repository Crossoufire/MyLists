import {auth} from "@/lib/server/auth";
import {createAuthClient} from "better-auth/react";
import {inferAdditionalFields} from "better-auth/client/plugins";


const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BASE_URL,
    plugins: [inferAdditionalFields<typeof auth>()],
});


export default authClient;
