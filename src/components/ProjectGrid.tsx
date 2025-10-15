"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Project, Organization } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectGridProps {
  organization: Organization;
  onSelectProject: (project: Project) => void;
  onBack: () => void;
}

export default function ProjectGrid({
  organization,
  onSelectProject,
  onBack,
}: ProjectGridProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="absolute top-8 left-8">
        <Button onClick={onBack} variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-4 text-center"
      >
        {organization.name}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground mb-12 text-center"
      >
        Select a Project
      </motion.p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {organization.projects.map((project, index) => {
          const completedTodos = project.todos.filter((t) => t.completed).length;
          const totalTodos = project.todos.length;
          const progress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

          return (
            <motion.button
              key={project.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectProject(project)}
              className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-border"
            >
              <div className="relative w-32 h-32 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={project.logo}
                  alt={project.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              <div className="w-full mt-2">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>
                    {completedTodos}/{totalTodos}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}