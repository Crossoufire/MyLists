import {createFileRoute} from "@tanstack/react-router";


export const Route = createFileRoute("/_admin/admin/_layout/mediadle")({
    component: RouteComponent,
})


function RouteComponent() {
    return <div>Hello "/_admin/admin/_layout/mediadle"!</div>
}
