import "../global.css";
import {Slot} from "expo-router";
import {queryClient} from "../libs/queryClient";
import {initializeApiClient} from "@mylists/api";
import {ApiClientMobile} from "../libs/apiClientMobile";
import {QueryClientProvider} from "@tanstack/react-query";


export default function RootLayout() {
    initializeApiClient(ApiClientMobile, "http://10.0.2.2:5000");

    return (
        <QueryClientProvider client={queryClient}>
            <Slot/>
        </QueryClientProvider>
    );
}
