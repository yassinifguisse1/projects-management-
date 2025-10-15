"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Calendar, Building2, FolderKanban } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  createdBy: string;
}

interface Project {
  id: string;
  name: string;
  logoUrl: string | null;
  organizationId: string;
  createdAt: string;
  createdBy: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Fetch organizations and projects created by user
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const token = localStorage.getItem("bearer_token");
        
        // Fetch organizations where user is creator
        const orgsResponse = await fetch(`/api/organizations?userId=${session.user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          // Filter to only show organizations created by this user
          const createdOrgs = orgsData.filter((org: Organization) => org.createdBy === session.user.id);
          setOrganizations(createdOrgs);
        }

        // Fetch projects where user is creator
        const projectsResponse = await fetch(`/api/projects?userId=${session.user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          // Filter to only show projects created by this user
          const createdProjects = projectsData.filter((proj: Project) => proj.createdBy === session.user.id);
          setProjects(createdProjects);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state while checking auth
  if (isPending || !session?.user) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={session.user.image || ""}
                alt={session.user.name || "User"}
              />
              <AvatarFallback className="text-2xl">
                {getInitials(session.user.name || "U")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">{session.user.name}</h2>
                <p className="text-muted-foreground">{session.user.email}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {session.user.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {formatDate(session.user.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={session.user.name || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={session.user.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>User ID: {session.user.id}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations Created
          </h3>
          {loadingData ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : organizations.length > 0 ? (
            <div className="space-y-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/organizations/${org.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDate(org.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No organizations created yet</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects Created
          </h3>
          {loadingData ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      {project.logoUrl ? (
                        <img
                          src={project.logoUrl}
                          alt={project.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <FolderKanban className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No projects created yet</p>
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}