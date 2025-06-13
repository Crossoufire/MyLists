import {auth} from "@/lib/server/core/auth";
import {createServerFileRoute} from "@tanstack/react-start/server";


export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
    GET: async ({ request }) => {
        return auth.handler(request);
    },
    POST: async ({ request }) => {
        return auth.handler(request);
    },
});
