import {useEffect} from "react";
import NProgress from "nprogress";
import {useRouter} from "@tanstack/react-router";


NProgress.configure({ showSpinner: false, parent: "body" });


export const useNProgress = () => {
    const router = useRouter();

    useEffect(() => {
        const handleStart = () => {
            NProgress.start()
        };

        const handleComplete = () => {
            NProgress.done()
        };

        const handleError = () => {
            NProgress.done()
        };

        const unsubscribeError = router.subscribe("onResolved", handleError);
        const unsubscribeStart = router.subscribe("onBeforeLoad", handleStart);
        const unsubscribeComplete = router.subscribe("onLoad", handleComplete);

        return () => {
            unsubscribeStart();
            unsubscribeComplete();
            unsubscribeError();
        }
    }, [router]);
};
