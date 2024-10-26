import {api} from "@/api/apiClient";
import {createFileRoute, redirect} from "@tanstack/react-router";


export const Route = createFileRoute("/_public")({
    beforeLoad: ({context: {auth}}) => {
        if (auth.currentUser && api.isAuthenticated()) {
            throw redirect({
                to: `/profile/${auth.currentUser.username}`
            });
        }
    },
});
