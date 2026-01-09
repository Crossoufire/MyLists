import {serverEnv} from "@/env/server";
import {getCookie, setCookie} from "@tanstack/react-start/server";


const algorithm = { name: "HMAC", hash: "SHA-256" };

export const ADMIN_COOKIE_NAME = "myListsAdminToken";


const sign = async (value: string) => {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(serverEnv.ADMIN_TOKEN_SECRET),
        algorithm,
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign(
        algorithm,
        key,
        new TextEncoder().encode(value)
    );

    return btoa(String.fromCharCode(...new Uint8Array(sig)));
};


export const verifyAdminToken = async (token: string, currentUserId: number) => {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 1) return false;

    const payload = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    const expected = await sign(payload);

    if (sig !== expected) return false;

    const [userId, exp] = payload.split(":");
    if (!userId || !exp) return false;

    // Check userId matches current user
    if (userId !== String(currentUserId)) return false;

    // Check not expired
    return Date.now() < parseInt(exp, 10);
};


export const setAdminCookie = async (userId: number) => {
    const exp = Date.now() + serverEnv.ADMIN_TTL_COOKIE_MIN * 60 * 1000;
    const payload = `${userId}:${exp}`;
    const sig = await sign(payload);

    setCookie(ADMIN_COOKIE_NAME, `${payload}.${sig}`, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: serverEnv.ADMIN_TTL_COOKIE_MIN * 60,
        secure: process.env.NODE_ENV === "production",
    });
};


export const isAdminAuthenticated = async (currentUserId: number) => {
    const token = getCookie(ADMIN_COOKIE_NAME);
    return token ? await verifyAdminToken(token, currentUserId) : false;
};
