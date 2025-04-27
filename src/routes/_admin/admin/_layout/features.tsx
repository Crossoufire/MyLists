import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/admin/_layout/features')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_admin/admin/_layout/features"!</div>
}
