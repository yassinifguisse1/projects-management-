"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Building2, FolderKanban, ListTodo, CheckCircle, Users, Zap } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Building2,
      title: "Organizations",
      description: "Create and manage multiple organizations for different teams and projects",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      icon: FolderKanban,
      title: "Projects",
      description: "Organize work into projects with dedicated task lists and team members",
      gradient: "from-teal-500 to-teal-600",
    },
    {
      icon: ListTodo,
      title: "Task Management",
      description: "Track todos with simple checkboxes and stay on top of your work",
      gradient: "from-purple-400 to-teal-500",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite members to organizations and assign them to specific projects",
      gradient: "from-teal-400 to-purple-500",
    },
    {
      icon: Zap,
      title: "Simple & Fast",
      description: "Clean interface focused on getting work done without distractions",
      gradient: "from-purple-500 to-teal-400",
    },
    {
      icon: CheckCircle,
      title: "Track Progress",
      description: "Visualize completion rates and monitor project health at a glance",
      gradient: "from-teal-500 to-purple-400",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Team Task Management
            <br />
            <span className="bg-gradient-to-r from-purple-500 via-teal-500 to-purple-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Organize your teams, manage projects, and track tasks all in one place.
            Built for teams that value simplicity and productivity.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => router.push("/register")}
              className="text-lg px-8 bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 border-0"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("/login")}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Stay Organized
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help teams collaborate and get work done efficiently.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              >
                <Card className="p-6 h-full border-0 shadow-sm hover:shadow-lg transition-all">
                  {/* Replace background with gradient and rounded-xl */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    {/* Icon inside the gradient circle, white text */}
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Card className="p-12 text-center border-0 shadow-sm bg-gradient-to-br from-purple-50 via-teal-50 to-purple-50 dark:from-purple-950/20 dark:via-teal-950/20 dark:to-purple-950/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join teams already using our platform to streamline their workflow and boost productivity.
            </p>
            <Button 
              size="lg"
              onClick={() => router.push("/register")}
              className="text-lg px-8 bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 border-0"
            >
              Create Your Free Account
            </Button>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>© 2025 Team Task Manager. Built for teams that value simplicity.</p>
      </footer>
    </div>
  );
}