import type React from "react";


export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 space-y-2 p-4 pt-10">
            {children}
        </div>
    );
}
