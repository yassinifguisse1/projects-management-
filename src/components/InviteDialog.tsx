"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Link2, Mail, Copy, CheckCheck } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface Organization {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  organizationId: string;
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState(false);
  const [openOrgCombobox, setOpenOrgCombobox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("email");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (open && session?.user?.id) {
      fetchOrganizations();
      fetchProjects();
    }
  }, [open, session]);

  // Reset project selection when organization changes
  useEffect(() => {
    setSelectedProjectIds([]);
    setAllProjects(false);
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/organizations?userId=${session.user.id}`);
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    }
  };

  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/projects?userId=${session.user.id}`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !session?.user?.id || !selectedOrgId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // Create organization invitation
      const orgPayload = {
        email,
        role,
        invitedBy: session.user.id,
        organizationId: selectedOrgId,
      };

      const orgResponse = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgPayload),
      });

      if (!orgResponse.ok) {
        toast.error("Failed to create invitation");
        setIsLoading(false);
        return;
      }

      const orgInvitation = await orgResponse.json();
      const invitationLink = `${window.location.origin}/invitations/${orgInvitation.id}`;

      // If email method, send email
      if (inviteMethod === "email") {
        await fetch("/api/send-invitation-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            invitationId: orgInvitation.id,
            organizationId: selectedOrgId,
            inviterUserId: session.user.id,
            role,
          }),
        });
      }

      // If specific projects are selected, create project invitations
      if (!allProjects && selectedProjectIds.length > 0) {
        for (const projectId of selectedProjectIds) {
          const projectResponse = await fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              role,
              invitedBy: session.user.id,
              organizationId: selectedOrgId,
              projectId,
            }),
          });

          if (projectResponse.ok && inviteMethod === "email") {
            const projectInvitation = await projectResponse.json();
            
            // Send email for each project invitation
            await fetch("/api/send-invitation-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                invitationId: projectInvitation.id,
                organizationId: selectedOrgId,
                projectId,
                inviterUserId: session.user.id,
                role,
              }),
            });
          }
        }
      }

      // Handle success based on method
      if (inviteMethod === "email") {
        setEmail("");
        setSelectedOrgId(null);
        setSelectedProjectIds([]);
        setAllProjects(false);
        setRole("member");
        setGeneratedLink(null);
        onOpenChange(false);
        
        toast.success("Invitation sent successfully! 📧", {
          description: `An email has been sent to ${email}`,
        });
      } else {
        // Link method - show the generated link
        setGeneratedLink(invitationLink);
        toast.success("Invitation link generated! 🔗", {
          description: "Share this link with the invitee",
        });
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error("Failed to create invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCloseDialog = () => {
    setEmail("");
    setSelectedOrgId(null);
    setSelectedProjectIds([]);
    setAllProjects(false);
    setRole("member");
    setGeneratedLink(null);
    setInviteMethod("email");
    setIsCopied(false);
    onOpenChange(false);
  };

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
  const filteredProjects = selectedOrgId
    ? projects.filter((p) => p.organizationId === selectedOrgId)
    : [];

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[550px]">
        {!generatedLink ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation via email or generate a shareable link.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Invite Method Tabs */}
              <div className="grid gap-2">
                <Label>Invitation Method</Label>
                <Tabs value={inviteMethod} onValueChange={(v) => setInviteMethod(v as "email" | "link")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </TabsTrigger>
                    <TabsTrigger value="link" className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Generate Link
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground mt-1">
                  {inviteMethod === "email" 
                    ? "An email will be sent to the invitee with an invitation link"
                    : "Generate a shareable link to send manually to the invitee"}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The invitation will be tied to this email address
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Select Organization *</Label>
                <Popover open={openOrgCombobox} onOpenChange={setOpenOrgCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openOrgCombobox}
                      className="justify-between"
                    >
                      {selectedOrg ? selectedOrg.name : "Select organization..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[460px] p-0">
                    <Command>
                      <CommandInput placeholder="Search organization..." />
                      <CommandEmpty>No organization found.</CommandEmpty>
                      <CommandGroup>
                        {organizations.map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.name}
                            onSelect={() => {
                              setSelectedOrgId(org.id);
                              setOpenOrgCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedOrgId === org.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {org.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedOrgId && (
                <div className="grid gap-3">
                  <Label>Project Access</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="all-projects"
                      checked={allProjects}
                      onCheckedChange={(checked) => {
                        setAllProjects(checked as boolean);
                        if (checked) {
                          setSelectedProjectIds([]);
                        }
                      }}
                    />
                    <Label htmlFor="all-projects" className="font-normal cursor-pointer">
                      All projects (no specific project selection)
                    </Label>
                  </div>

                  {!allProjects && filteredProjects.length > 0 && (
                    <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Or select specific projects:
                      </p>
                      {filteredProjects.map((project) => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjectIds.includes(project.id)}
                            onCheckedChange={() => handleProjectToggle(project.id)}
                          />
                          <Label
                            htmlFor={`project-${project.id}`}
                            className="font-normal cursor-pointer"
                          >
                            {project.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {!allProjects && filteredProjects.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No projects in this organization yet.
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as "member" | "admin")}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedOrgId}>
                {isLoading ? "Processing..." : inviteMethod === "email" ? "Send Invitation" : "Generate Link"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Link generated view
          <>
            <DialogHeader>
              <DialogTitle>Invitation Link Generated! 🔗</DialogTitle>
              <DialogDescription>
                Share this link with <strong>{email}</strong>. They must log in with this email to accept.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-1">Invitation Link</p>
                    <p className="text-sm font-mono truncate">{generatedLink}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <div className="space-y-2 text-sm">
                <p className="font-medium">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>This invitation is specifically for <strong className="text-foreground">{email}</strong></li>
                  <li>The recipient must log in with this email address to accept</li>
                  <li>The link expires in 7 days</li>
                  <li>You can share this link via any communication method</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCloseDialog}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}