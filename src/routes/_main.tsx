import React from "react";
import {createFileRoute, Outlet} from "@tanstack/react-router";


export const Route = createFileRoute("/_main")({
    component: MainLayout,
});


function MainLayout() {
    return (
        <main className="flex-1 w-[100%] max-w-[1320px] px-2 mx-auto">
            <Outlet/>
        </main>
    );
}
