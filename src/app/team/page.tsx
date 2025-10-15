"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, FolderKanban, Mail, Shield, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
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

interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  projectId: string | null;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface ProjectMemberDetail {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
  projectId: string;
  projectName: string;
}

interface OrganizationMemberDetail {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  organizationId: string;
  organizationName: string;
}

export default function TeamPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgMemberships, setOrgMemberships] = useState<OrganizationMemberDetail[]>([]);
  const [projectMemberships, setProjectMemberships] = useState<ProjectMemberDetail[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user?.id) {
      fetchTeamData();
    }
  }, [session, isPending]);

  const fetchTeamData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);

      // Fetch all organizations for the user
      const orgResponse = await fetch(`/api/organizations?userId=${session.user.id}`);
      const orgsData = await orgResponse.json();
      setOrganizations(orgsData);

      // Fetch all projects for the user
      const projectsResponse = await fetch(`/api/projects?userId=${session.user.id}`);
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);

      // Fetch organization memberships
      const orgMembershipsData: OrganizationMemberDetail[] = [];
      for (const org of orgsData) {
        const membersResponse = await fetch(`/api/organization-members?organizationId=${org.id}`);
        const members = await membersResponse.json();
        
        for (const member of members) {
          orgMembershipsData.push({
            ...member,
            organizationId: org.id,
            organizationName: org.name,
          });
        }
      }
      setOrgMemberships(orgMembershipsData);

      // Fetch project memberships
      const projectMembershipsData: ProjectMemberDetail[] = [];
      for (const project of projectsData) {
        const membersResponse = await fetch(`/api/project-members?projectId=${project.id}`);
        const members = await membersResponse.json();
        
        for (const member of members) {
          projectMembershipsData.push({
            ...member,
            projectId: project.id,
            projectName: project.name,
          });
        }
      }
      setProjectMemberships(projectMembershipsData);

      // Fetch pending invitations across all organizations
      const allInvitations: Invitation[] = [];
      for (const org of orgsData) {
        const invitationsResponse = await fetch(
          `/api/invitations?organizationId=${org.id}&status=pending`
        );
        const invitations = await invitationsResponse.json();
        allInvitations.push(...invitations);
      }
      setPendingInvitations(allInvitations);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations?id=${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel invitation");
      }

      toast.success("Invitation cancelled");
      fetchTeamData(); // Refresh data
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      toast.error("Failed to cancel invitation");
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const getOrganizationName = (orgId: string) => {
    return organizations.find((o) => o.id === orgId)?.name || "Unknown";
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || "Unknown";
  };

  return (
    <div className="container mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2">Team Members</h1>
        <p className="text-muted-foreground mb-8">
          View all your organization and project memberships, and pending invitations
        </p>
      </motion.div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Pending Invitations</h2>
                <p className="text-sm text-muted-foreground">
                  {pendingInvitations.length} pending {pendingInvitations.length === 1 ? "invitation" : "invitations"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingInvitations.map((invitation) => {
                const isExpired = new Date(invitation.expiresAt) < new Date();
                return (
                  <div
                    key={invitation.id}
                    className="p-4 rounded-lg border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {invitation.projectId
                              ? `${getOrganizationName(invitation.organizationId)} → ${getProjectName(invitation.projectId)}`
                              : getOrganizationName(invitation.organizationId)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {invitation.role}
                            </Badge>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Memberships */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Organizations</h2>
                <p className="text-sm text-muted-foreground">
                  {organizations.length} {organizations.length === 1 ? "organization" : "organizations"}
                </p>
              </div>
            </div>

            {organizations.length > 0 ? (
              <div className="space-y-3">
                {organizations.map((org) => {
                  const userMembership = orgMemberships.find(
                    (m) => m.organizationId === org.id && m.userId === session?.user?.id
                  );
                  const totalMembers = orgMemberships.filter((m) => m.organizationId === org.id).length;

                  return (
                    <div
                      key={org.id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/organizations/${org.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {org.logoUrl ? (
                            <img
                              src={org.logoUrl}
                              alt={org.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{org.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {totalMembers} {totalMembers === 1 ? "member" : "members"}
                          </p>
                        </div>
                        {userMembership && (
                          <Badge variant={userMembership.role === "owner" ? "default" : "secondary"}>
                            {userMembership.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No organizations yet</p>
                <Button onClick={() => router.push("/")}>
                  Create Organization
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Project Memberships */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Projects</h2>
                <p className="text-sm text-muted-foreground">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </p>
              </div>
            </div>

            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => {
                  const userMembership = projectMemberships.find(
                    (m) => m.projectId === project.id && m.id === session?.user?.id
                  );
                  const totalMembers = projectMemberships.filter((m) => m.projectId === project.id).length;
                  const organization = organizations.find((o) => o.id === project.organizationId);

                  return (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          {project.logoUrl ? (
                            <img
                              src={project.logoUrl}
                              alt={project.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <FolderKanban className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{project.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {organization?.name} • {totalMembers} {totalMembers === 1 ? "member" : "members"}
                          </p>
                        </div>
                        {userMembership && (
                          <Badge variant={userMembership.role === "owner" ? "default" : "secondary"}>
                            {userMembership.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => router.push("/")}>
                  Create Project
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}