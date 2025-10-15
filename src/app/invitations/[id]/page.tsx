"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { toast } from "sonner";

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

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Project {
  id: string;
  name: string;
}

export default function InvitationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading) {
      fetchInvitation();
    }
  }, [sessionLoading]);

  const fetchInvitation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch invitation details
      const response = await fetch(`/api/invitations/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Invitation not found or has expired");
        } else {
          setError("Failed to load invitation");
        }
        setIsLoading(false);
        return;
      }

      const invData = await response.json();
      setInvitation(invData);

      // Check if invitation is expired
      if (new Date(invData.expiresAt) < new Date()) {
        setError("This invitation has expired");
        setIsLoading(false);
        return;
      }

      // Check if already accepted
      if (invData.status === "accepted") {
        setError("This invitation has already been accepted");
        setIsLoading(false);
        return;
      }

      // Check if rejected
      if (invData.status === "rejected") {
        setError("This invitation has been declined");
        setIsLoading(false);
        return;
      }

      // Fetch organization details
      const orgResponse = await fetch(`/api/organizations/${invData.organizationId}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData);
      }

      // Fetch project details if applicable
      if (invData.projectId) {
        const projResponse = await fetch(`/api/projects/${invData.projectId}`);
        if (projResponse.ok) {
          const projData = await projResponse.json();
          setProject(projData);
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching invitation:", err);
      setError("Failed to load invitation");
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!session?.user) {
      toast.error("Please log in to accept this invitation");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!invitation) return;

    // Check if logged-in email matches invitation email
    if (session.user.email !== invitation.email) {
      toast.error(`This invitation is for ${invitation.email}. Please log in with the correct account.`);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to accept invitation");
        setIsProcessing(false);
        return;
      }

      toast.success("Invitation accepted! Redirecting...");
      
      // Redirect to organization or project
      setTimeout(() => {
        if (invitation.projectId && project) {
          router.push(`/projects/${invitation.projectId}`);
        } else if (organization) {
          router.push(`/organizations/${organization.id}`);
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      toast.error("Failed to accept invitation");
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!invitation) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reject: true }),
      });

      if (!response.ok) {
        toast.error("Failed to decline invitation");
        setIsProcessing(false);
        return;
      }

      toast.success("Invitation declined");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      toast.error("Failed to decline invitation");
      setIsProcessing(false);
    }
  };

  if (isLoading || sessionLoading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <Card className="p-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
            <div className="flex gap-4 justify-center mt-8">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Invitation Error</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button onClick={() => router.push("/")}>
              Go to Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!invitation || !organization) {
    return null;
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              {organization.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="w-16 h-16 object-contain rounded-full"
                />
              ) : (
                <Building2 className="h-10 w-10 text-primary" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">You're Invited!</h1>
            <p className="text-muted-foreground">
              You've been invited to join <strong>{organization.name}</strong>
              {project && (
                <>
                  {" "}on the project <strong>{project.name}</strong>
                </>
              )}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {invitation.email}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Organization</span>
              <span className="font-medium">{organization.name}</span>
            </div>
            
            {project ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="font-medium">{project.name}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Access</span>
                <span className="font-medium">All organization projects</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {!session?.user ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please log in with <strong>{invitation.email}</strong> to accept this invitation
              </p>
              <Button
                size="lg"
                onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                className="w-full"
              >
                Log In to Accept
              </Button>
            </div>
          ) : session.user.email !== invitation.email ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-destructive">
                This invitation is for <strong>{invitation.email}</strong>, but you're logged in as <strong>{session.user.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Please log out and log in with the correct account
              </p>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Decline
              </Button>
              <Button
                size="lg"
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {isProcessing ? "Accepting..." : "Accept Invitation"}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}