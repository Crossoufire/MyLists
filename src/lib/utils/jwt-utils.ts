import jwt from "jsonwebtoken";
import {serverEnv} from "@/env/server";
import {createServerOnlyFn} from "@tanstack/react-start";


export const adminCookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: serverEnv.ADMIN_TTL_COOKIE_MIN * 60 * 1000,
};


export const createAdminToken = createServerOnlyFn(() => () => {
    return jwt.sign({
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + (serverEnv.ADMIN_TTL_COOKIE_MIN * 60),
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
