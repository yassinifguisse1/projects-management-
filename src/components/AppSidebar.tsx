"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Plus,
  ChevronDown,
  ChevronRight } from
"lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader } from
"@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Project {
  id: string;
  name: string;
  logoUrl: string | null;
  organizationId: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openOrgs, setOpenOrgs] = useState<Record<string, boolean>>({});
  const [showNewOrgDialog, setShowNewOrgDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session?.user?.id) {
      fetchData();
    }
  }, [session, isPending]);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      // Fetch organizations
      const orgResponse = await fetch(`/api/organizations?userId=${session.user.id}`);
      const orgData = await orgResponse.json();
      setOrganizations(orgData);

      // Fetch all projects
      const projectsResponse = await fetch(`/api/projects?userId=${session.user.id}`);
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newOrgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to create an organization");
      router.push("/login");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName.trim(),
          createdBy: session.user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      const newOrg = await response.json();
      setOrganizations((prev) => [...prev, newOrg]);
      setNewOrgName("");
      setShowNewOrgDialog(false);
      toast.success("Organization created successfully");

      // Trigger dashboard refetch
      window.dispatchEvent(new Event("refetch-dashboard"));
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!selectedOrgId) {
      toast.error("Organization not selected");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to create a project");
      router.push("/login");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          organizationId: selectedOrgId,
          createdBy: session.user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      const newProject = await response.json();

      // Add creator as project member
      await fetch("/api/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newProject.id,
          userId: session.user.id,
          role: "owner"
        })
      });

      setProjects((prev) => [...prev, newProject]);
      setNewProjectName("");
      setSelectedOrgId(null);
      setShowNewProjectDialog(false);
      toast.success("Project created successfully");

      // Trigger dashboard refetch
      window.dispatchEvent(new Event("refetch-dashboard"));

      // Navigate to new project
      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenNewProject = (orgId: number) => {
    setSelectedOrgId(orgId.toString());
    setNewProjectName("");
    setShowNewProjectDialog(true);
  };

  const toggleOrg = (orgId: number) => {
    setOpenOrgs((prev) => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  const getProjectsByOrg = (orgId: number) => {
    return projects.filter((p) => p.organizationId === orgId.toString());
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <Link href="/" className="flex items-center justify-center py-4 !w-full !h-[79px]">
          <img
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/Untitled-700-x-200-px-1760305157699.png"
            alt="Organizabl"
            className="h-12 w-auto" />

        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-2">
            <SidebarGroupLabel>Organizations</SidebarGroupLabel>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setShowNewOrgDialog(true)}>

              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            {isLoading ?
            <div className="space-y-2 px-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div> :

            <SidebarMenu>
                {organizations.map((org) => {
                const orgProjects = getProjectsByOrg(org.id);
                const isOpen = openOrgs[org.id];

                return (
                  <Collapsible
                    key={org.id}
                    open={isOpen}
                    onOpenChange={() => toggleOrg(org.id)}>

                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          <SidebarMenuButton
                          asChild
                          isActive={pathname === `/organizations/${org.id}`}
                          className="flex-1">

                            <Link href={`/organizations/${org.id}`}>
                              <Building2 className="h-4 w-4" />
                              <span>{org.name}</span>
                            </Link>
                          </SidebarMenuButton>
                          <CollapsibleTrigger asChild>
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleOrg(org.id);
                            }}>

                              {isOpen ?
                            <ChevronDown className="h-4 w-4" /> :

                            <ChevronRight className="h-4 w-4" />
                            }
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {orgProjects.length > 0 ?
                          <>
                                {orgProjects.map((project) =>
                            <SidebarMenuSubItem key={project.id}>
                                    <SidebarMenuSubButton
                                asChild
                                isActive={pathname === `/projects/${project.id}`}>

                                      <Link href={`/projects/${project.id}`}>
                                        <FolderKanban className="h-4 w-4" />
                                        <span>{project.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                            )}
                              </> :

                          <SidebarMenuSubItem>
                                <SidebarMenuSubButton disabled>
                                  <span className="text-muted-foreground text-xs">No projects</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                          }
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton onClick={() => handleOpenNewProject(org.id)}>
                                <Plus className="h-4 w-4" />
                                <span>New Project</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>);

              })}
              </SidebarMenu>
            }
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/team"}>
                  <Link href="/team">
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Dialog open={showNewOrgDialog} onOpenChange={setShowNewOrgDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to manage your projects and team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrganization}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Enter organization name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  disabled={isCreating}
                  autoFocus />

              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewOrgDialog(false)}
                disabled={isCreating}>

                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to your selected organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={isCreating}
                  autoFocus />

              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewProjectDialog(false)}
                disabled={isCreating}>

                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>);

}