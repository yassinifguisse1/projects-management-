"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserPlus, Bell, Search, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { InviteDialog } from "@/components/InviteDialog";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  status: string;
  organizationId: string | null;
  projectId: string | null;
}

interface AppNavbarProps {
  showSidebarTrigger?: boolean;
}

export function AppNavbar({ showSidebarTrigger = false }: AppNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending, refetch } = useSession();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchInvitations();
    }
  }, [session]);

  const fetchInvitations = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`/api/invitations?email=${encodeURIComponent(session.user.email)}&status=pending`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");

    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    if (error?.code) {
      toast.error("Failed to sign out");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Signed out successfully");
      router.push("/login");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Determine if sidebar should be shown - must match LayoutWrapper logic exactly
  const noSidebarRoutes = ["/landing", "/login", "/register"];
  const shouldHideSidebar = noSidebarRoutes.some(route => pathname.startsWith(route));
  const showSidebar = !shouldHideSidebar && !isPending && session?.user;

  if (isPending) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          {/* No SidebarTrigger during loading */}
        </div>
      </header>
    );
  }

  if (!session?.user) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/register")}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4 px-4 !w-full !h-[57px]">
        {showSidebarTrigger && (
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        )}

        <div className="flex-1 flex items-center gap-4">
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects, tasks..."
                className="pl-8 w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {invitations.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {invitations.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {invitations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                invitations.map((inv) => (
                  <DropdownMenuItem key={inv.id} className="flex flex-col items-start p-3">
                    <p className="text-sm font-medium">
                      {inv.organizationId ? "Organization" : "Project"} Invitation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You have a pending invitation
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                  <AvatarFallback>{getInitials(session.user.name || "U")}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <InviteDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </header>
  );
}