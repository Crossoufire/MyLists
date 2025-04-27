import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_admin/admin/_layout/achievements")({
    component: RouteComponent,
})


function RouteComponent() {
    return <div>Hello "/_admin/admin/_layout/achievements"!</div>
}
