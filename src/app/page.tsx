"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FolderKanban, ListTodo, Users } from "lucide-react";

interface Stats {
  organizations: number;
  projects: number;
  todos: number;
  totalTodos: number;
  completedTodos: number;
}

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  createdBy: string | null;
}

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/landing");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
  }, [session]);

  // Add event listener for refetch events
  useEffect(() => {
    const handleRefetch = () => {
      if (session?.user?.id) {
        fetchStats();
      }
    };

    window.addEventListener("refetch-dashboard", handleRefetch);
    return () => window.removeEventListener("refetch-dashboard", handleRefetch);
  }, [session]);

  const fetchStats = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      // Fetch organizations for current user
      const orgsResponse = await fetch(`/api/organizations?userId=${session.user.id}`);
      const orgsData = await orgsResponse.json();
      setOrganizations(orgsData);

      // Fetch projects for current user
      const projectsResponse = await fetch(`/api/projects?userId=${session.user.id}`);
      const projectsData = await projectsResponse.json();

      // Fetch todos for all projects
      const todosResponse = await fetch("/api/todos");
      const todos = await todosResponse.json();

      const completedTodos = todos.filter((t: any) => t.completed).length;

      setStats({
        organizations: orgsData.length,
        projects: projectsData.length,
        todos: todos.length,
        totalTodos: todos.length,
        completedTodos,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isPending || !session?.user) {
    return null;
  }

  const statCards = [
    {
      title: "Organizations",
      value: stats?.organizations || 0,
      icon: Building2,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Projects",
      value: stats?.projects || 0,
      icon: FolderKanban,
      gradient: "from-teal-500 to-teal-600",
    },
    {
      title: "Total Tasks",
      value: stats?.totalTodos || 0,
      icon: ListTodo,
      gradient: "from-purple-400 to-teal-400",
    },
    {
      title: "Completed Tasks",
      value: stats?.completedTodos || 0,
      icon: ListTodo,
      gradient: "from-teal-400 to-purple-400",
    },
  ];

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your workspace.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Organizations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Your Organizations</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-8 border-0 shadow-sm">
                <Skeleton className="h-24 w-24 rounded-2xl mx-auto mb-4" />
                <Skeleton className="h-5 w-32 mx-auto" />
              </Card>
            ))}
          </div>
        ) : organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org, index) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card 
                  className="p-8 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => router.push(`/organizations/${org.id}`)}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-teal-100 dark:from-purple-900/20 dark:to-teal-900/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      {org.logoUrl ? (
                        <img 
                          src={org.logoUrl} 
                          alt={org.name} 
                          className="w-full h-full object-contain rounded-2xl"
                        />
                      ) : (
                        <Building2 className="h-12 w-12 text-purple-500" />
                      )}
                    </div>
                    <p className="text-base font-semibold text-center line-clamp-2">{org.name}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-0 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-teal-100 dark:from-purple-900/20 dark:to-teal-900/20 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No organizations found</p>
          </Card>
        )}
      </motion.div>
    </div>
  );
}