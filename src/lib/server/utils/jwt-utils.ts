import jwt from "jsonwebtoken";


export const createAdminToken = () => {
    return jwt.sign({
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + (1 * 60), // 1 minute
    }, process.env.ADMIN_TOKEN_SECRET as string);
};


export const verifyAdminToken = (token: string) => {
    try {
        jwt.verify(token, process.env.ADMIN_TOKEN_SECRET as string);
        return true;
    }
    catch {
        return false;
    }
};
