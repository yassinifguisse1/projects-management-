"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project, Organization, Todo } from "@/lib/data";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface TodoListProps {
  organization: Organization;
  project: Project;
  onBack: () => void;
}

export default function TodoList({
  organization,
  project,
  onBack,
}: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(project.todos);
  const [newTodoText, setNewTodoText] = useState("");

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: Todo = {
        id: `todo-${Date.now()}`,
        text: newTodoText.trim(),
        completed: false,
      };
      setTodos((prev) => [...prev, newTodo]);
      setNewTodoText("");
    }
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={onBack} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <Image
                src={project.logo}
                alt={project.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                {organization.name}
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {todos.length} completed
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
              transition={{ duration: 0.5 }}
            />
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter task description..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTodo();
                }
              }}
              className="flex-1"
            />
            <Button onClick={addTodo} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Tasks</h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {todos.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-8"
                >
                  No tasks yet. Add your first task above!
                </motion.p>
              ) : (
                todos.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      id={todo.id}
                    />
                    <label
                      htmlFor={todo.id}
                      className={`flex-1 cursor-pointer ${
                        todo.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {todo.text}
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </div>
  );
}