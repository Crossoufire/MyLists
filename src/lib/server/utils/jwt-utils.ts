import jwt from "jsonwebtoken";
import {serverEnv} from "@/env/server";


export const createAdminToken = () => {
    return jwt.sign({
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minute
    }, serverEnv.ADMIN_TOKEN_SECRET);
};


export const verifyAdminToken = (token: string) => {
    try {
        jwt.verify(token, serverEnv.ADMIN_TOKEN_SECRET);
        return true;
    }
    catch {
        return false;
    }
};
