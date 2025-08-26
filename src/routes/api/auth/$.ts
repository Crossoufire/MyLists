import {auth} from "@/lib/server/core/auth";
import {createServerFileRoute} from "@tanstack/react-start/server";


export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
    GET: ({ request }) => {
        return auth.handler(request);
    },
    POST: ({ request }) => {
        return auth.handler(request);
    },
});
