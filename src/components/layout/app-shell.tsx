"use client";

import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { TabBar } from "@/components/layout/tab-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px]">
      <DesktopSidebar />
      <main id="main-content" className="w-full flex-1 pb-24 md:pb-0">{children}</main>
      <TabBar />
    </div>
  );
}
