import {useEffect} from "react";
import posthog from "posthog-js";
import {useAuth} from "@/lib/client/hooks/use-auth";


export function PostHogAuthSync() {
    const { currentUser, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;

        if (currentUser && currentUser.id) {
            posthog.identify(String(currentUser.id), {
                username: currentUser.name,
            });
        }
        else {
            posthog.reset();
        }
    }, [currentUser, isLoading]);

    return null;
}
