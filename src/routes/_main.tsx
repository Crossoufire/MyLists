import React from "react";
import {createFileRoute, Outlet} from "@tanstack/react-router";


export const Route = createFileRoute("/_main")({
    component: MainLayout,
});


function MainLayout() {
    return (
        <main className="min-h-screen w-full max-w-7xl mx-auto px-8 max-sm:px-2">
            <Outlet/>
        </main>
    );
}
