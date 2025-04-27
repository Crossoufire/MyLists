import {SidebarProvider} from "@/lib/components/ui/sidebar";
import {createFileRoute, Outlet} from "@tanstack/react-router";
import {AdminSidebar} from "@/lib/components/admin/AdminSidebar";


export const Route = createFileRoute("/_admin/admin/_layout")({
    component: DashboardPage,
});


function DashboardPage() {
    return (
        <SidebarProvider>
            <AdminSidebar/>
            <Outlet/>
        </SidebarProvider>
    );
}
