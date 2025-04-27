import type React from "react";


interface DashboardShellProps {
    children: React.ReactNode
}


export function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="flex-1 space-y-2 p-4 pt-6 md:p-8">
            {children}
        </div>
    );
}
