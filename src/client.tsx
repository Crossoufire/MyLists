import {hydrateRoot} from "react-dom/client";
import {StartClient} from "@tanstack/react-start/client";


hydrateRoot(document, <StartClient/>);


// function App() {
//     if (import.meta.env.DEV) {
//         return <StartClient/>;
//     }
//
//     return (
//         <PostHogProvider
//             apiKey={clientEnv.VITE_PUBLIC_POSTHOG_KEY}
//             options={{
//                 defaults: "2025-11-30",
//                 capture_exceptions: true,
//                 debug: import.meta.env.DEV,
//                 capture_pageview: "history_change",
//                 person_profiles: "identified_only",
//                 api_host: clientEnv.VITE_PUBLIC_POSTHOG_HOST,
//                 ui_host: clientEnv.VITE_PUBLIC_POSTHOG_UI_HOST,
//             }}
//         >
//             <StartClient/>
//         </PostHogProvider>
//     );
// }
