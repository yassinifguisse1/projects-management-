"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MoreVertical, UserPlus, Settings, Upload, X, FolderKanban, User, ChevronRight, ChevronDown, Edit2, Check, ImageIcon, FileText, Paperclip, Eye, Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
"@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { InviteDialog } from "@/components/InviteDialog";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  projectId: string;
  parentId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  description?: string | null;
  attachments?: string | null;
  subtasks?: Todo[];
}

interface Project {
  id: string;
  name: string;
  logoUrl: string | null;
  organizationId: string;
}

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { data: session, isPending: isSessionLoading } = useSession();

  const [project, setProject] = useState<Project | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectLogo, setEditProjectLogo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAttachments, setTaskAttachments] = useState<string[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [useDefaultLogo, setUseDefaultLogo] = useState<'icon' | 'text' | 'custom'>('icon');

  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      router.push("/login");
      return;
    }

    if (projectId && session?.user) {
      fetchProjectData();
    }
  }, [projectId, session, isSessionLoading]);

  const fetchProjectData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);

      // Fetch project details
      const projectResponse = await fetch(`/api/projects?id=${projectId}`);
      const projectData = await projectResponse.json();
      setProject(projectData);

      // Fetch organization details
      if (projectData.organizationId) {
        const orgResponse = await fetch(`/api/organizations?id=${projectData.organizationId}`);
        const orgData = await orgResponse.json();
        setOrganization(orgData);
      }

      // Fetch todos for this project (with subtasks included)
      const todosResponse = await fetch(`/api/todos?projectId=${projectId}&includeSubtasks=true`);
      const todosData = await todosResponse.json();
      
      // Normalize attachments from API - convert arrays back to JSON strings for state consistency
      const normalizeTodo = (todo: any) => {
        if (todo.attachments && Array.isArray(todo.attachments)) {
          todo.attachments = JSON.stringify(todo.attachments);
        }
        if (todo.subtasks) {
          todo.subtasks = todo.subtasks.map(normalizeTodo);
        }
        return todo;
      };
      
      setTodos(todosData.map(normalizeTodo));

      // Fetch project members
      const membersResponse = await fetch(`/api/project-members?projectId=${projectId}`);
      const membersData = await membersResponse.json();
      setMembers(membersData);

      // Fetch user's role in this project
      const userMemberResponse = await fetch(`/api/project-members?projectId=${projectId}&userId=${session.user.id}`);
      const userMemberData = await userMemberResponse.json();
      if (userMemberData && userMemberData.length > 0) {
        setUserRole(userMemberData[0].role);
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = () => {
    setEditProjectName(project?.name || "");
    setEditProjectLogo(project?.logoUrl || "");
    setLogoFile(null);
    setLogoPreview(project?.logoUrl || "");
    
    // Determine current logo type - using new logo URL
    if (project?.logoUrl === "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/image-1760305492267.png") {
      setUseDefaultLogo('icon');
    } else if (project?.logoUrl === "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/2-1760304510328.png") {
      setUseDefaultLogo('text');
    } else {
      setUseDefaultLogo('custom');
    }
    
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
    setEditProjectLogo("");
    setUseDefaultLogo('icon');
  };

  const handleSaveSettings = async () => {
    if (!editProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setIsSaving(true);

      let logoUrl: string | null = null;

      if (useDefaultLogo === 'icon') {
        logoUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/image-1760305492267.png";
      } else if (useDefaultLogo === 'text') {
        logoUrl = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/2-1760304510328.png";
      } else if (logoFile) {
        logoUrl = logoPreview;
      } else if (logoPreview) {
        logoUrl = logoPreview;
      }

      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProjectName.trim(),
          logoUrl: logoUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update project");
        return;
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      toast.success("Project updated successfully!");
      setIsSettingsDialogOpen(false);

      await fetchProjectData();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    if (!session?.user?.id) {
      toast.error("You must be logged in to add tasks");
      return;
    }

    setIsAddingTodo(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newTodoText.trim(),
          projectId,
          completed: false,
          createdBy: session.user.id
        })
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos((prev) => [...prev, { ...newTodo, subtasks: [] }]);
        setNewTodoText("");
        toast.success("Task created successfully!");
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
      toast.error("Failed to create task");
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleAddSubtask = async (parentId: string) => {
    if (!newSubtaskText.trim()) return;

    if (!session?.user?.id) {
      toast.error("You must be logged in to add subtasks");
      return;
    }

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newSubtaskText.trim(),
          projectId,
          parentId,
          completed: false,
          createdBy: session.user.id
        })
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setTodos((prev) =>
        prev.map((todo) =>
        todo.id === parentId ?
        { ...todo, subtasks: [...(todo.subtasks || []), newSubtask] } :
        todo
        )
        );
        setNewSubtaskText("");
        setAddingSubtaskFor(null);
        setExpandedTasks((prev) => new Set(prev).add(parentId));
        toast.success("Subtask created successfully!");
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
      toast.error("Failed to create subtask");
    }
  };

  const handleToggleTodo = async (todoId: string, completed: boolean, parentId?: string | null) => {
    let previousTodosSnapshot: Todo[] | null = null;

    try {
      const response = await fetch(`/api/todos?id=${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed })
      });

      if (response.ok) {
        if (parentId) {
          // Update subtask
          setTodos((prev) =>
          prev.map((todo) =>
          todo.id === parentId ?
          {
            ...todo,
            subtasks: todo.subtasks?.map((subtask) =>
            subtask.id === todoId ? { ...subtask, completed: !completed } : subtask
            )
          } :
          todo
          )
          );
        } else {
          // Update parent task and all subtasks
          const parentTodo = todos.find((t) => t.id === todoId);
          const hasSubtasks = parentTodo?.subtasks && parentTodo.subtasks.length > 0;

          if (hasSubtasks && !completed) {
            // Mark all subtasks as completed when parent is checked
            const subtaskIds = parentTodo.subtasks!.map((st) => st.id);
            const cloneTodos = (items: Todo[]): Todo[] =>
              items.map((item) => ({
                ...item,
                subtasks: item.subtasks ? cloneTodos(item.subtasks) : undefined
              }));

            previousTodosSnapshot = cloneTodos(todos);

            // Optimistically update UI state
            setTodos((prev) =>
            prev.map((todo) =>
            todo.id === todoId ?
            {
              ...todo,
              completed: true,
              subtasks: todo.subtasks?.map((subtask) => ({
                ...subtask,
                completed: true
              }))
            } :
            todo
            )
            );

            // Update all subtasks on the server
            await Promise.all(
              subtaskIds.map((subtaskId) =>
              fetch(`/api/todos?id=${subtaskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: true })
              })
              )
            );

            toast.success(`Task and ${subtaskIds.length} subtask(s) completed!`);
          } else {
            // Just update the parent task
            setTodos((prev) =>
            prev.map((todo) =>
            todo.id === todoId ? { ...todo, completed: !completed } : todo
            )
            );
          }
        }
      }
    } catch (error) {
      if (previousTodosSnapshot) {
        setTodos(previousTodosSnapshot);
      }
      console.error("Failed to toggle todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTodo = async (todoId: string, parentId?: string | null) => {
    try {
      const response = await fetch(`/api/todos?id=${todoId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        const data = await response.json();
        if (parentId) {
          // Delete subtask
          setTodos((prev) =>
          prev.map((todo) =>
          todo.id === parentId ?
          {
            ...todo,
            subtasks: todo.subtasks?.filter((subtask) => subtask.id !== todoId)
          } :
          todo
          )
          );
        } else {
          // Delete parent task (and all subtasks are already deleted by API)
          setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
        }

        const subtaskCount = data.deletedSubtasksCount || 0;
        if (subtaskCount > 0) {
          toast.success(`Task and ${subtaskCount} subtask(s) deleted!`);
        } else {
          toast.success("Task deleted successfully!");
        }
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleStartEdit = (todoId: string, currentText: string) => {
    setEditingTaskId(todoId);
    setEditingTaskText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const handleSaveEdit = async (todoId: string, parentId: string | null = null) => {
    if (!editingTaskText.trim()) {
      toast.error("Task text cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/todos?id=${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editingTaskText.trim() })
      });

      if (response.ok) {
        const updatedTodo = await response.json();

        if (parentId) {
          // Update subtask
          setTodos((prev) =>
          prev.map((todo) =>
          todo.id === parentId ?
          {
            ...todo,
            subtasks: todo.subtasks?.map((subtask) =>
            subtask.id === todoId ? { ...subtask, text: updatedTodo.text } : subtask
            )
          } :
          todo
          )
          );
        } else {
          // Update parent task
          setTodos((prev) =>
          prev.map((todo) =>
          todo.id === todoId ? { ...todo, text: updatedTodo.text } : todo
          )
          );
        }

        toast.success("Task updated successfully!");
        setEditingTaskId(null);
        setEditingTaskText("");
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
      toast.error("Failed to update task");
    }
  };

  const handleOpenTaskDetails = (todo: Todo) => {
    setSelectedTask(todo);
    setTaskDescription(todo.description || "");

    // Safe parsing of attachments
    let parsedAttachments: string[] = [];
    try {
      if (todo.attachments && typeof todo.attachments === 'string') {
        parsedAttachments = JSON.parse(todo.attachments);
      }
    } catch (error) {
      console.error("Failed to parse attachments in details dialog:", error);
      parsedAttachments = [];
    }

    setTaskAttachments(parsedAttachments);
    setDetailsDialogOpen(true);
  };

  const handleViewTaskDetails = (todo: Todo) => {
    setSelectedTask(todo);
    setTaskDescription(todo.description || "");
    setEditedDescription(todo.description || "");
    setIsEditingDescription(false);

    // Safe parsing of attachments
    let parsedAttachments: string[] = [];
    try {
      if (todo.attachments && typeof todo.attachments === 'string') {
        parsedAttachments = JSON.parse(todo.attachments);
      }
    } catch (error) {
      console.error("Failed to parse attachments in view dialog:", error);
      parsedAttachments = [];
    }

    setTaskAttachments(parsedAttachments);
    setViewDialogOpen(true);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingAttachment(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const newAttachments = [...taskAttachments, base64String];
      setTaskAttachments(newAttachments);
      
      // Auto-save to database
      if (!selectedTask) {
        toast.success("Attachment added");
        setUploadingAttachment(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/todos?id=${selectedTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachments: JSON.stringify(newAttachments)
          })
        });

        if (response.ok) {
          const updatedTodo = await response.json();
          
          // Parse and re-stringify attachments from response to maintain consistency
          let attachmentsForState: string | null = null;
          if (updatedTodo.attachments) {
            if (Array.isArray(updatedTodo.attachments)) {
              attachmentsForState = JSON.stringify(updatedTodo.attachments);
            } else if (typeof updatedTodo.attachments === 'string') {
              attachmentsForState = updatedTodo.attachments;
            }
          }
          
          // Update the task in state
          if (selectedTask.parentId) {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === selectedTask.parentId
                  ? {
                      ...todo,
                      subtasks: todo.subtasks?.map((subtask) =>
                        subtask.id === selectedTask.id
                          ? { ...subtask, attachments: attachmentsForState }
                          : subtask
                      )
                    }
                  : todo
              )
            );
          } else {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === selectedTask.id
                  ? { ...todo, attachments: attachmentsForState }
                  : todo
              )
            );
          }

          // Update selectedTask with the saved data
          setSelectedTask({
            ...selectedTask,
            attachments: attachmentsForState
          });

          toast.success("Attachment added and saved!");
        } else {
          toast.error("Failed to save attachment");
          // Rollback on error
          setTaskAttachments(taskAttachments);
        }
      } catch (error) {
        console.error("Failed to upload attachment:", error);
        toast.error("Failed to upload attachment");
        // Rollback on error
        setTaskAttachments(taskAttachments);
      } finally {
        setUploadingAttachment(false);
        // Reset the input so the same file can be uploaded again
        e.target.value = '';
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async (index: number) => {
    if (!selectedTask) {
      setTaskAttachments((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    
    const oldAttachments = [...taskAttachments];
    const newAttachments = taskAttachments.filter((_, i) => i !== index);
    setTaskAttachments(newAttachments);
    
    // Auto-save to database
    try {
      const response = await fetch(`/api/todos?id=${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: newAttachments.length > 0 ? JSON.stringify(newAttachments) : null
        })
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        
        // Parse and re-stringify attachments from response
        let attachmentsForState: string | null = null;
        if (updatedTodo.attachments) {
          if (Array.isArray(updatedTodo.attachments)) {
            attachmentsForState = JSON.stringify(updatedTodo.attachments);
          } else if (typeof updatedTodo.attachments === 'string') {
            attachmentsForState = updatedTodo.attachments;
          }
        }
        
        // Update the task in state
        if (selectedTask.parentId) {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === selectedTask.parentId
                ? {
                    ...todo,
                    subtasks: todo.subtasks?.map((subtask) =>
                      subtask.id === selectedTask.id
                        ? { ...subtask, attachments: attachmentsForState }
                        : subtask
                    )
                  }
                : todo
            )
          );
        } else {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === selectedTask.id
                ? { ...todo, attachments: attachmentsForState }
                : todo
            )
          );
        }

        // Update selectedTask with the saved data
        setSelectedTask({
          ...selectedTask,
          attachments: attachmentsForState
        });

        toast.success("Attachment removed!");
      } else {
        toast.error("Failed to remove attachment");
        // Rollback on error
        setTaskAttachments(oldAttachments);
      }
    } catch (error) {
      console.error("Failed to remove attachment:", error);
      toast.error("Failed to remove attachment");
      // Rollback on error
      setTaskAttachments(oldAttachments);
    }
  };

  const handleSaveViewDialogChanges = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/todos?id=${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editedDescription.trim() || null,
          attachments: taskAttachments.length > 0 ? JSON.stringify(taskAttachments) : null
        })
      });

      if (response.ok) {
        const updatedTodo = await response.json();

        // Update the task in state
        if (selectedTask.parentId) {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === selectedTask.parentId
                ? {
                    ...todo,
                    subtasks: todo.subtasks?.map((subtask) =>
                      subtask.id === selectedTask.id
                        ? { ...subtask, description: updatedTodo.description, attachments: updatedTodo.attachments }
                        : subtask
                    )
                  }
                : todo
            )
          );
        } else {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === selectedTask.id
                ? { ...todo, description: updatedTodo.description, attachments: updatedTodo.attachments }
                : todo
            )
          );
        }

        // Update selectedTask with the saved data
        setSelectedTask({
          ...selectedTask,
          description: updatedTodo.description,
          attachments: updatedTodo.attachments
        });

        setTaskDescription(editedDescription);
        setIsEditingDescription(false);
        toast.success("Task details saved successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save task details");
      }
    } catch (error) {
      console.error("Failed to update task details:", error);
      toast.error("Failed to update task details");
    }
  };

  const handleAddAttachmentInView = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingAttachment(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const newAttachments = [...taskAttachments, base64String];
        setTaskAttachments(newAttachments);
        
        // Auto-save to database
        if (!selectedTask) {
          setUploadingAttachment(false);
          return;
        }
        
        const response = await fetch(`/api/todos?id=${selectedTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachments: JSON.stringify(newAttachments)
          })
        });

        if (response.ok) {
          const updatedTodo = await response.json();
          
          // Update the task in state
          if (selectedTask.parentId) {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === selectedTask.parentId
                  ? {
                      ...todo,
                      subtasks: todo.subtasks?.map((subtask) =>
                        subtask.id === selectedTask.id
                          ? { ...subtask, attachments: updatedTodo.attachments }
                          : subtask
                      )
                    }
                  : todo
              )
            );
          } else {
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === selectedTask.id
                  ? { ...todo, attachments: updatedTodo.attachments }
                  : todo
              )
            );
          }

          // Update selectedTask with the saved data
          setSelectedTask({
            ...selectedTask,
            attachments: updatedTodo.attachments
          });

          toast.success("Attachment added and saved!");
        } else {
          toast.error("Failed to save attachment");
          // Rollback on error
          setTaskAttachments(taskAttachments.filter((_, i) => i !== newAttachments.length - 1));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      toast.error("Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
      // Reset the input so the same file can be uploaded again
      e.target.value = '';
    }
  };

  const handleRemoveAttachmentInView = async (index: number) => {
    if (!selectedTask) return;
    
    const oldAttachments = [...taskAttachments];
    const newAttachments = taskAttachments.filter((_, i) => i !== index);
    setTaskAttachments(newAttachments);
    
    // Auto-save to database
    try {
      const response = await fetch(`/api/todos?id=${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: newAttachments.length > 0 ? JSON.stringify(newAttachments) : null
        })
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        
        // Update the task in state
        if (selectedTask.parentId) {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === selectedTask.parentId
                ? {
                    ...todo,
                    subtasks: todo.subtasks?.map((subtask) =>
                      subtask.id === selectedTask.id
                        ? { ...subtask, attachments: updatedTodo.attachments }
                        : subtask
                    )
                  }
                : todo
            )
          );
        } else {
          setTodos((prev) =>
            prev.map((todo) =>
              todo.id === selectedTask.id
                ? { ...todo, attachments: updatedTodo.attachments }
                : todo
            )
          );
        }

        // Update selectedTask with the saved data
        setSelectedTask({
          ...selectedTask,
          attachments: updatedTodo.attachments
        });

        toast.success("Attachment removed!");
      } else {
        toast.error("Failed to remove attachment");
        // Rollback on error
        setTaskAttachments(oldAttachments);
      }
    } catch (error) {
      console.error("Failed to remove attachment:", error);
      toast.error("Failed to remove attachment");
      // Rollback on error
      setTaskAttachments(oldAttachments);
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const renderTodoItem = (todo: Todo, depth: number = 0, parentId: string | null = null) => {
    const creator = getCreatorInfo(todo.createdBy);
    const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
    const isExpanded = expandedTasks.has(todo.id);
    const isAddingSubtask = addingSubtaskFor === todo.id;
    const isEditing = editingTaskId === todo.id;
    const hasDescription = todo.description && todo.description.trim().length > 0;

    // Safe parsing of attachments
    let parsedAttachments: string[] = [];
    try {
      if (todo.attachments && typeof todo.attachments === 'string') {
        parsedAttachments = JSON.parse(todo.attachments);
      }
    } catch (error) {
      console.error("Failed to parse attachments:", error);
      parsedAttachments = [];
    }
    const hasAttachments = parsedAttachments.length > 0;
    const hasDetails = hasDescription || hasAttachments;
    
    // Different colors for parent tasks vs subtasks with more distinct separation
    const isSubtask = depth > 0;
    const bgColor = isSubtask ? "bg-primary/10" : "bg-muted/50";
    const hoverBgColor = isSubtask ? "bg-primary/20" : "bg-muted";
    const borderColor = isSubtask ? "border-l-2 border-primary/40" : "";

    return (
      <div key={todo.id}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`flex items-center gap-3 p-4 ${bgColor} rounded-lg hover:${hoverBgColor} transition-colors group ${borderColor}`}
          style={{ marginLeft: `${depth * 24}px` }}>

          {hasSubtasks ?
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => toggleExpanded(todo.id)}>

              {isExpanded ?
            <ChevronDown className="h-4 w-4" /> :

            <ChevronRight className="h-4 w-4" />
            }
            </Button> :

          <div className="w-6 h-6 flex-shrink-0" />
          }
          
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => handleToggleTodo(todo.id, todo.completed, parentId)}
            id={`todo-${todo.id}`} />

          
          {creator ?
          <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0">
                  <Avatar className="h-6 w-6 cursor-pointer">
                    <AvatarImage src={creator.avatarUrl || ""} alt={creator.name} />
                    <AvatarFallback className="text-[10px]">
                      {creator.name ?
                    creator.name.
                    split(" ").
                    map((n) => n[0]).
                    join("").
                    toUpperCase() :
                    "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-semibold">{creator.name}</p>
                  <p className="text-xs opacity-90">{creator.email}</p>
                  <p className="text-xs opacity-90 capitalize">{creator.role}</p>
                  <p className="text-xs opacity-75 mt-1">
                    Created: {new Date(todo.createdAt).toLocaleString()}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip> :

          <div className="flex-shrink-0">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          }
          
          {isEditing ?
          <div className="flex-1 flex items-center gap-2">
              <Input
              value={editingTaskText}
              onChange={(e) => setEditingTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveEdit(todo.id, parentId);
                } else if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              autoFocus
              className="flex-1" />

              <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSaveEdit(todo.id, parentId)}>

                <Check className="h-4 w-4" />
              </Button>
              <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}>

                <X className="h-4 w-4" />
              </Button>
            </div> :

          <div className="flex-1 flex items-center gap-2">
              <label
              htmlFor={`todo-${todo.id}`}
              className={`flex-1 cursor-pointer ${
              todo.completed ? "line-through text-muted-foreground" : ""}`
              }>

                {todo.text}
              </label>
              {(hasDescription || hasAttachments) &&
            <div className="flex gap-1">
                  {hasDescription &&
              <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Has description</p>
                      </TooltipContent>
                    </Tooltip>
              }
                  {hasAttachments &&
              <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{parsedAttachments.length} attachment(s)</p>
                      </TooltipContent>
                    </Tooltip>
              }
                </div>
            }
            </div>
          }
          
          {!isEditing &&
          <>
              {todo.completed &&
            <Badge variant="secondary" className="text-xs">
                  Completed
                </Badge>
            }
              
              {hasSubtasks &&
            <Badge variant="outline" className="text-xs">
                  {todo.subtasks.length} {todo.subtasks.length === 1 ? "subtask" : "subtasks"}
                </Badge>
            }
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleViewTaskDetails(todo)}>

                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hasDetails ? "View details" : "Add details"}</p>
                </TooltipContent>
              </Tooltip>
            </>
          }
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity">

                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenTaskDetails(todo)}>
                <FileText className="h-4 w-4 mr-2" />
                {hasDetails ? "View Details" : "Add Details"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStartEdit(todo.id, todo.text)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddingSubtaskFor(todo.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteTodo(todo.id, parentId)}
                className="text-destructive">

                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
        
        {/* Subtask input form */}
        {isAddingSubtask &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2"
          style={{ marginLeft: `${(depth + 1) * 24}px` }}>

            <div className="flex gap-2 p-3 bg-muted/30 rounded-lg">
              <Input
              placeholder="Add a subtask..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask(todo.id);
                } else if (e.key === "Escape") {
                  setAddingSubtaskFor(null);
                  setNewSubtaskText("");
                }
              }}
              autoFocus
              className="flex-1" />

              <Button size="sm" onClick={() => handleAddSubtask(todo.id)}>
                Add
              </Button>
              <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingSubtaskFor(null);
                setNewSubtaskText("");
              }}>

                Cancel
              </Button>
            </div>
          </motion.div>
        }
        
        {/* Render subtasks recursively */}
        {isExpanded && hasSubtasks &&
        <div className="mt-2 space-y-2">
            {todo.subtasks.map((subtask) => renderTodoItem(subtask, depth + 1, todo.id))}
          </div>
        }
      </div>);

  };

  const getCreatorInfo = (createdBy: string | null) => {
    if (!createdBy) return null;
    const creator = members.find((m) => m.id === createdBy);
    return creator || null;
  };

  const completedCount = todos.reduce((count, todo) => {
    let total = todo.completed ? 1 : 0;
    if (todo.subtasks) {
      total += todo.subtasks.filter((st) => st.completed).length;
    }
    return count + total;
  }, 0);

  const totalCount = todos.reduce((count, todo) => {
    return count + 1 + (todo.subtasks?.length || 0);
  }, 0);

  const progress = totalCount > 0 ? completedCount / totalCount * 100 : 0;

  if (isSessionLoading || isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>);

  }

  if (!project) {
    return (
      <div className="container mx-auto p-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Project not found</h1>
          <p className="text-muted-foreground">
            The project you're looking for doesn't exist.
          </p>
        </Card>
      </div>);

  }

  return (
    <div className="container mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8">

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{project.name}</h1>
              {organization && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {organization.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Organization</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-muted-foreground">
              Manage tasks and collaborate with your team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member) =>
              <Avatar key={member.id} className="border-2 border-background">
                  <AvatarImage src={member.avatarUrl || ""} alt={member.name || "User"} />
                  <AvatarFallback>
                    {member.name ?
                  member.name.
                  split(" ").
                  map((n) => n[0]).
                  join("").
                  toUpperCase() :
                  "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              {members.length > 3 &&
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border-2 border-background text-xs font-medium">
                  +{members.length - 3}
                </div>
              }
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
            {(userRole === "admin" || userRole === "owner") &&
            <Button size="sm" variant="outline" onClick={handleOpenSettings}>
                <Settings className="h-5 w-5" />
              </Button>
            }
          </div>
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </Card>
      </motion.div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <form onSubmit={handleAddTodo} className="flex gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              disabled={isAddingTodo}
              className="flex-1" />

            <Button type="submit" disabled={isAddingTodo}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Tasks ({totalCount})
          </h2>
          <TooltipProvider>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {todos.length === 0 ?
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-muted-foreground">

                    <p>No tasks yet. Add your first task above!</p>
                  </motion.div> :

                todos.map((todo) => renderTodoItem(todo))
                }
              </AnimatePresence>
            </div>
          </TooltipProvider>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Update your project details and logo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-logo">Project Logo</Label>
              
              {/* Logo Selection Options */}
              <div className="space-y-3">
                {/* Default Icon Logo Option */}
                <div 
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    useDefaultLogo === 'icon' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setUseDefaultLogo('icon');
                    setLogoPreview("https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/image-1760305492267.png");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border">
                      <img
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/image-1760305492267.png"
                        alt="Organizabl Icon"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Icon Logo</p>
                      <p className="text-xs text-muted-foreground">Organizabl brand icon</p>
                    </div>
                    {useDefaultLogo === 'icon' && (
                      <div className="text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Default Text Logo Option */}
                <div 
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    useDefaultLogo === 'text' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setUseDefaultLogo('text');
                    setLogoPreview("https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/2-1760304510328.png");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border">
                      <img
                        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/2-1760304510328.png"
                        alt="Organizabl Text"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Text Logo</p>
                      <p className="text-xs text-muted-foreground">Organizabl brand name</p>
                    </div>
                    {useDefaultLogo === 'text' && (
                      <div className="text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Upload Option */}
                <div 
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    useDefaultLogo === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setUseDefaultLogo('custom');
                    document.getElementById('logo-upload')?.click();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview && useDefaultLogo === 'custom' ? (
                        <img
                          src={logoPreview}
                          alt="Custom logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Custom Logo</p>
                      <p className="text-xs text-muted-foreground">Upload your own image (max 5MB)</p>
                    </div>
                    {useDefaultLogo === 'custom' && (
                      <div className="text-primary">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleLogoFileChange(e);
                      setUseDefaultLogo('custom');
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 rounded-lg bg-white flex items-center justify-center overflow-hidden border-2">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <FolderKanban className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <InviteDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />

      {/* Task Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              Add a description and attachments to this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedTask?.text}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <textarea
                id="task-description"
                placeholder="Add a detailed description..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full min-h-[120px] p-3 rounded-lg border bg-background resize-y" />

            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="space-y-3">
                {taskAttachments.map((attachment, index) =>
                <div key={index} className="relative group">
                    <div className="border rounded-lg overflow-hidden">
                      <img
                      src={attachment}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-48 object-cover" />

                    </div>
                    <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveAttachment(index)}>

                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('attachment-upload')?.click()}
                  disabled={uploadingAttachment}
                  className="w-full">

                  <ImageIcon className="h-4 w-4 mr-2" />
                  {uploadingAttachment ? "Uploading..." : "Add Attachment"}
                </Button>
                <input
                  id="attachment-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAttachmentUpload}
                  className="hidden" />

                <p className="text-xs text-muted-foreground">
                  Upload images (max 10MB per file)
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}>

              Cancel
            </Button>
            <Button onClick={async () => {
              if (!selectedTask) return;

              try {
                const response = await fetch(`/api/todos?id=${selectedTask.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    description: taskDescription.trim() || null,
                    attachments: taskAttachments.length > 0 ? JSON.stringify(taskAttachments) : null
                  })
                });

                if (response.ok) {
                  const updatedTodo = await response.json();

                  // Update the task in state
                  if (selectedTask.parentId) {
                    setTodos((prev) =>
                      prev.map((todo) =>
                        todo.id === selectedTask.parentId
                          ? {
                              ...todo,
                              subtasks: todo.subtasks?.map((subtask) =>
                                subtask.id === selectedTask.id
                                  ? { ...subtask, description: updatedTodo.description, attachments: updatedTodo.attachments }
                                  : subtask
                              )
                            }
                          : todo
                      )
                    );
                  } else {
                    setTodos((prev) =>
                      prev.map((todo) =>
                        todo.id === selectedTask.id
                          ? { ...todo, description: updatedTodo.description, attachments: updatedTodo.attachments }
                          : todo
                      )
                    );
                  }

                  toast.success("Task details saved successfully!");
                  setDetailsDialogOpen(false);
                } else {
                  const error = await response.json();
                  toast.error(error.error || "Failed to save task details");
                }
              } catch (error) {
                console.error("Failed to update task details:", error);
                toast.error("Failed to update task details");
              }
            }}>
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh] overflow-hidden p-0 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-background z-10 border-b px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <DialogTitle className="text-2xl font-semibold mb-1">{selectedTask?.text}</DialogTitle>
                <DialogDescription className="text-sm">
                  Created {selectedTask && new Date(selectedTask.createdAt).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setViewDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6 flex-1 overflow-y-auto max-w-[1800px] mx-auto w-full">
            {/* Metadata Grid */}
            <div className="grid grid-cols-4 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                <Badge variant={selectedTask?.completed ? "secondary" : "default"} className="w-fit">
                  {selectedTask?.completed ? "Completed" : "In Progress"}
                </Badge>
              </div>

              {/* Created By */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created By</Label>
                {selectedTask?.createdBy && (() => {
                  const creator = getCreatorInfo(selectedTask.createdBy);
                  return creator ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={creator.avatarUrl || ""} alt={creator.name} />
                        <AvatarFallback className="text-[10px]">
                          {creator.name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{creator.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unknown</span>
                  );
                })()}
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtasks</Label>
                <div className="text-sm font-medium">{selectedTask?.subtasks?.length || 0} total</div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</Label>
                <div className="text-sm font-medium">
                  {selectedTask && new Date(selectedTask.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Description Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
                {!isEditingDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingDescription(true);
                      setEditedDescription(taskDescription);
                    }}
                  >
                    <Edit2 className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Add a detailed description..."
                    className="w-full min-h-[200px] p-4 rounded-lg border bg-background resize-y text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveViewDialogChanges}>
                      <Save className="h-3 w-3 mr-1.5" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingDescription(false);
                        setEditedDescription(taskDescription);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : taskDescription ? (
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setIsEditingDescription(true);
                    setEditedDescription(taskDescription);
                  }}
                >
                  {taskDescription}
                </div>
              ) : (
                <div 
                  className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setIsEditingDescription(true);
                    setEditedDescription("");
                  }}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click to add description</p>
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Attachments Section */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Attachments {taskAttachments.length > 0 && `(${taskAttachments.length})`}
              </Label>
              {taskAttachments.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {taskAttachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      <div className="border rounded-lg overflow-hidden bg-muted aspect-video">
                        <img
                          src={attachment}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(attachment, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveAttachmentInView(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No attachments</p>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('view-attachment-upload')?.click()}
                disabled={uploadingAttachment}
                className="w-full"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                {uploadingAttachment ? "Uploading..." : "Add Attachment"}
              </Button>
              <input
                id="view-attachment-upload"
                type="file"
                accept="image/*"
                onChange={handleAddAttachmentInView}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                Upload images (max 10MB per file)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t px-8 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}
