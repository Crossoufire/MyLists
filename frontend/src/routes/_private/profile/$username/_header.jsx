import {profileOptions} from "@/api/queryOptions";
import {createFileRoute, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header")({
    loader: async ({ context: { auth, queryClient }, params: { username } }) => {
        const apiData = await queryClient.ensureQueryData(profileOptions(username));

        // Not allowed to view non-public profile if user not logged in
        if (!auth.currentUser && apiData.user_data?.privacy !== "public") {
            throw redirect({
                to: "/",
                search: { message: "You need to be logged in to view this profile" },
            });
        }
    }
});
