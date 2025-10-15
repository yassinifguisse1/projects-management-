"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { useSession } from "@/lib/auth-client";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  
  // Routes that should not have sidebar
  const noSidebarRoutes = ["/landing", "/login", "/register"];
  const shouldHideSidebar = noSidebarRoutes.some(route => pathname.startsWith(route));

  // Also hide sidebar if user is not logged in
  const showSidebar = !shouldHideSidebar && !isPending && session?.user;

  if (!showSidebar) {
    return (
      <>
        <AppNavbar showSidebarTrigger={false} />
        {children}
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppNavbar showSidebarTrigger={true} />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}