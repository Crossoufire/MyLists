import jwt from "jsonwebtoken";
import {serverEnv} from "@/env/server";
import {createServerOnlyFn} from "@tanstack/react-start";


export const createAdminToken = createServerOnlyFn(() => () => {
    return jwt.sign({
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minute
    }, serverEnv.ADMIN_TOKEN_SECRET, { algorithm: "HS256" });
})();


export const verifyAdminToken = createServerOnlyFn(() => (token: string) => {
    try {
        jwt.verify(token, serverEnv.ADMIN_TOKEN_SECRET, { algorithms: ["HS256"] });
        return true;
    }
    catch {
        return false;
    }
})();
