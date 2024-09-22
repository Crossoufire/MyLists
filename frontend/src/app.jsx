import {router} from "@/router";
import {useAuth} from "@/hooks/AuthHook";
import {queryClient} from "@/api/queryClient";
import {RouterProvider} from "@tanstack/react-router";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {QueryClientProvider} from "@tanstack/react-query";


export default function App() {
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <InnerApp/>
            </QueryClientProvider>
        </ThemeProvider>
    );
}


function InnerApp() {
    const auth = useAuth();
    if (auth.isLoading) return;
    return <RouterProvider router={router} context={{ auth, queryClient }}/>;
}
