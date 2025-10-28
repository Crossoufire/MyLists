import type React from "react";


export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col w-full max-w-[1200px] mx-auto mt-2 mb-20">
            {children}
        </div>
    );
}
