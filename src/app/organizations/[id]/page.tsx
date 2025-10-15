"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderKanban, ArrowLeft, Building2, Users, ListTodo, Settings, Trash2, Upload, X, UserPlus, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  organizationId: string;
  createdAt: string;
  createdBy: string | null;
}

interface Todo {
  id: string;
  projectId: string;
  completed: boolean;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  projectId: string | null;
  status: string;
  createdAt: string;
}

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const { data: session, isPending: isSessionLoading } = useSession();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, { total: number; completed: number }>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgDescription, setEditOrgDescription] = useState("");
  const [editOrgLogo, setEditOrgLogo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  
  // Invite member state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteProjectId, setInviteProjectId] = useState<string>("all");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [inviteMode, setInviteMode] = useState<"all" | "select">("all");

  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      router.push("/login");
      return;
    }
    
    if (organizationId && session?.user) {
      fetchOrganizationData();
    }
  }, [organizationId, session, isSessionLoading]);

  const fetchOrganizationData = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch organization details
      const orgResponse = await fetch(`/api/organizations/${organizationId}`);
      const orgData = await orgResponse.json();
      setOrganization(orgData);

      // Fetch user's role in this organization
      const memberResponse = await fetch(`/api/organization-members?organizationId=${organizationId}&userId=${session.user.id}`);
      const memberData = await memberResponse.json();
      if (memberData && memberData.length > 0) {
        setUserRole(memberData[0].role);
      }

      // Fetch all members
      const allMembersResponse = await fetch(`/api/organization-members?organizationId=${organizationId}`);
      const allMembersData = await allMembersResponse.json();
      setMembers(allMembersData);

      // Fetch pending invitations
      const invitationsResponse = await fetch(`/api/invitations?organizationId=${organizationId}&status=pending`);
      const invitationsData = await invitationsResponse.json();
      setInvitations(invitationsData);

      // Fetch projects for this organization
      const projectsResponse = await fetch(`/api/projects?organizationId=${organizationId}`);
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch todos for statistics
      const todosResponse = await fetch("/api/todos");
      const todos: Todo[] = await todosResponse.json();

      // Calculate stats for each project
      const stats: Record<string, { total: number; completed: number }> = {};
      projectsData.forEach((project: Project) => {
        const projectTodos = todos.filter((t) => t.projectId === project.id);
        stats[project.id] = {
          total: projectTodos.length,
          completed: projectTodos.filter((t) => t.completed).length,
        };
      });
      setProjectStats(stats);
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to create a project");
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          organizationId,
          createdBy: session.user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to create project");
        return;
      }

      const newProject = await response.json();
      
      // Add creator as project member
      await fetch("/api/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newProject.id,
          userId: session.user.id,
          role: "owner",
        }),
      });

      toast.success("Project created successfully!");
      setIsCreateDialogOpen(false);
      setProjectName("");
      
      // Trigger dashboard refetch
      window.dispatchEvent(new Event("refetch-dashboard"));
      
      // Refresh projects list
      await fetchOrganizationData();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (inviteMode === "select" && selectedProjectIds.length === 0) {
      toast.error("Please select at least one project");
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to invite members");
      return;
    }

    try {
      setIsInviting(true);
      
      if (inviteMode === "all") {
        // Send one invitation for all projects
        const response = await fetch("/api/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteEmail.trim().toLowerCase(),
            organizationId,
            projectId: null,
            role: inviteRole,
            invitedBy: session.user.id,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || "Failed to send invitation");
          return;
        }

        toast.success("Invitation sent for all projects!");
      } else {
        // Send individual invitations for each selected project
        const invitationPromises = selectedProjectIds.map(projectId =>
          fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: inviteEmail.trim().toLowerCase(),
              organizationId,
              projectId,
              role: inviteRole,
              invitedBy: session.user.id,
            }),
          })
        );

        const results = await Promise.all(invitationPromises);
        const failedInvites = results.filter(r => !r.ok);

        if (failedInvites.length > 0) {
          toast.error(`Failed to send ${failedInvites.length} invitation(s)`);
          return;
        }

        toast.success(`Invitations sent for ${selectedProjectIds.length} project(s)!`);
      }

      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteMode("all");
      setSelectedProjectIds([]);
      
      // Refresh invitations list
      await fetchOrganizationData();
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleProjectCheckboxChange = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(prev => [...prev, projectId]);
    } else {
      setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
    }
  };

  const handleSelectAllProjects = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(p => p.id));
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to revoke invitation");
        return;
      }

      toast.success("Invitation revoked");
      await fetchOrganizationData();
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      toast.error("Failed to revoke invitation");
    }
  };

  const handleOpenSettings = () => {
    setEditOrgName(organization?.name || "");
    setEditOrgDescription(organization?.description || "");
    setEditOrgLogo(organization?.logoUrl || "");
    setLogoFile(null);
    setLogoPreview(organization?.logoUrl || "");
    setIsSettingsDialogOpen(true);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setEditOrgLogo("");
  };

  const handleSaveSettings = async () => {
    if (!editOrgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      setIsSaving(true);
      
      let logoUrl: string | null = null;
      
      if (logoFile) {
        logoUrl = logoPreview;
      } 
      else if (!logoPreview) {
        logoUrl = null;
      }
      else {
        logoUrl = logoPreview;
      }

      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editOrgName.trim(),
          description: editOrgDescription.trim() || null,
          logoUrl: logoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update organization");
        return;
      }

      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
      toast.success("Organization updated successfully!");
      setIsSettingsDialogOpen(false);
      
      await fetchOrganizationData();
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!confirm("Are you sure you want to delete this organization? This action cannot be undone and will delete all projects and tasks.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete organization");
        return;
      }

      toast.success("Organization deleted successfully!");
      router.push("/");
    } catch (error) {
      console.error("Failed to delete organization:", error);
      toast.error("Failed to delete organization");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24 w-24 rounded-lg mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-8">
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The organization you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
            {organization.description && (
              <p className="text-muted-foreground text-lg">
                {organization.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FolderKanban className="h-4 w-4" />
                {projects.length} {projects.length === 1 ? "Project" : "Projects"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {members.length} {members.length === 1 ? "Member" : "Members"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {(userRole === "admin" || userRole === "owner") && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setIsMembersDialogOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleOpenSettings}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Projects</h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const stats = projectStats[project.id] || { total: 0, completed: 0 };
              const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Card
                    className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {project.logoUrl ? (
                          <img
                            src={project.logoUrl}
                            alt={project.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FolderKanban className="h-12 w-12 text-white" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ListTodo className="h-4 w-4" />
                          {stats.total} {stats.total === 1 ? "task" : "tasks"}
                        </span>
                        <span>
                          {stats.completed} completed
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FolderKanban className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first project in this organization.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <FolderKanban className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}
      </motion.div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to {organization?.name}. You can add more details later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              View and manage organization members and pending invitations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Members ({members.length})</h3>
              <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>

            <div className="space-y-2">
              {members.length > 0 ? (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">User #{member.userId}</p>
                        <p className="text-xs text-muted-foreground">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
              )}
            </div>

            {invitations.length > 0 && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Pending Invitations ({invitations.length})</h3>
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {invitation.projectId ? `Project-specific (ID: ${invitation.projectId})` : "All projects"} • {invitation.role}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Project Access</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-projects"
                    checked={inviteMode === "all"}
                    onCheckedChange={(checked) => {
                      setInviteMode(checked ? "all" : "select");
                      if (checked) {
                        setSelectedProjectIds([]);
                      }
                    }}
                  />
                  <label
                    htmlFor="all-projects"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    All Projects (current and future)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-projects"
                    checked={inviteMode === "select"}
                    onCheckedChange={(checked) => {
                      setInviteMode(checked ? "select" : "all");
                      if (!checked) {
                        setSelectedProjectIds([]);
                      }
                    }}
                  />
                  <label
                    htmlFor="select-projects"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Select specific projects
                  </label>
                </div>
              </div>

              {inviteMode === "select" && (
                <div className="mt-3 space-y-2 pl-6 border-l-2 border-muted">
                  {projects.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Select projects ({selectedProjectIds.length}/{projects.length})
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAllProjects}
                          className="h-auto py-1 text-xs"
                        >
                          {selectedProjectIds.length === projects.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {projects.map((project) => (
                          <div key={project.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`project-${project.id}`}
                              checked={selectedProjectIds.includes(project.id)}
                              onCheckedChange={(checked) =>
                                handleProjectCheckboxChange(project.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`project-${project.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {project.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No projects available. Create a project first.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteDialogOpen(false);
                setInviteMode("all");
                setSelectedProjectIds([]);
              }}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Organization Settings</DialogTitle>
            <DialogDescription>
              Manage your organization details and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-logo">Organization Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Organization logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an image (max 5MB)
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="Enter organization name"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                placeholder="Enter organization description (optional)"
                value={editOrgDescription}
                onChange={(e) => setEditOrgDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteOrganization}
                disabled={isDeleting}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete Organization"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete the organization and all its projects.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsDialogOpen(false)}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}