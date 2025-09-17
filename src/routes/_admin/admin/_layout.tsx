import React from "react";
import {createFileRoute, Outlet} from "@tanstack/react-router";
import {AdminSidebar} from "@/lib/components/admin/AdminSidebar";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/lib/components/ui/sidebar";


export const Route = createFileRoute("/_admin/admin/_layout")({
    component: DashboardPage,
});


function DashboardPage() {
    return (
        <SidebarProvider>
            <AdminSidebar/>
            <SidebarInset>
                <header className="flex h-12 shrink-0 items-center gap-2 px-2">
                    <SidebarTrigger className="-ml-1"/>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Outlet/>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
