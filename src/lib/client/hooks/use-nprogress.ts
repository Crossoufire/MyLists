import {useEffect} from "react";
import NProgress from "nprogress";
import {useRouter} from "@tanstack/react-router";


NProgress.configure({ showSpinner: false, parent: "body" });


interface ProgressOpts {
    pendingMs?: number;
    pendingMinMs?: number;
}


export const useNProgress = ({ pendingMs = 80, pendingMinMs = 200 }: ProgressOpts = {}) => {
    const router = useRouter();

    useEffect(() => {
        let startedAt = 0;
        let minTimer: ReturnType<typeof setTimeout> | undefined;
        let showTimer: ReturnType<typeof setTimeout> | undefined;

        const handleStart = () => {
            startedAt = 0;
            showTimer = setTimeout(() => {
                NProgress.start();
                startedAt = Date.now();
                minTimer = setTimeout(() => {
                    minTimer = undefined;
                    if (startedAt === -1) NProgress.done();
                }, pendingMinMs);
            }, pendingMs);
        };

        const handleComplete = () => {
            clearTimeout(showTimer);
            showTimer = undefined;

            if (startedAt === 0) return;
            if (startedAt === -1) return;

            if (minTimer) {
                startedAt = -1;
            }
            else {
                NProgress.done();
            }
        };

        const handleError = () => handleComplete();

        const unsubError = router.subscribe("onResolved", handleError);
        const unsubStart = router.subscribe("onBeforeLoad", handleStart);
        const unsubComplete = router.subscribe("onLoad", handleComplete);

        return () => {
            unsubStart();
            unsubComplete();
            unsubError();
            clearTimeout(showTimer);
            clearTimeout(minTimer);
            NProgress.done();
        };
    }, [router, pendingMs, pendingMinMs]);

    return null;
};
