export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  logo: string;
  todos: Todo[];
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  projects: Project[];
}

// Sample data
export const organizations: Organization[] = [
  {
    id: "org1",
    name: "Tech Corp",
    logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=200&h=200&fit=crop",
    projects: [
      {
        id: "proj1",
        name: "Website Redesign",
        logo: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&h=200&fit=crop",
        todos: [
          { id: "todo1", text: "Design homepage mockup", completed: false },
          { id: "todo2", text: "Create color palette", completed: true },
          { id: "todo3", text: "Build component library", completed: false },
          { id: "todo4", text: "Implement responsive layout", completed: false },
        ],
      },
      {
        id: "proj2",
        name: "Mobile App",
        logo: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&h=200&fit=crop",
        todos: [
          { id: "todo5", text: "Setup React Native project", completed: true },
          { id: "todo6", text: "Design app screens", completed: false },
          { id: "todo7", text: "Implement authentication", completed: false },
        ],
      },
      {
        id: "proj3",
        name: "API Development",
        logo: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop",
        todos: [
          { id: "todo8", text: "Design database schema", completed: true },
          { id: "todo9", text: "Create REST endpoints", completed: false },
          { id: "todo10", text: "Write API documentation", completed: false },
        ],
      },
    ],
  },
  {
    id: "org2",
    name: "Creative Studio",
    logo: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&h=200&fit=crop",
    projects: [
      {
        id: "proj4",
        name: "Brand Identity",
        logo: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&h=200&fit=crop",
        todos: [
          { id: "todo11", text: "Research competitors", completed: true },
          { id: "todo12", text: "Create mood board", completed: true },
          { id: "todo13", text: "Design logo concepts", completed: false },
        ],
      },
      {
        id: "proj5",
        name: "Marketing Campaign",
        logo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
        todos: [
          { id: "todo14", text: "Define target audience", completed: false },
          { id: "todo15", text: "Create content calendar", completed: false },
          { id: "todo16", text: "Design social media posts", completed: false },
        ],
      },
    ],
  },
  {
    id: "org3",
    name: "Startup Inc",
    logo: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=200&h=200&fit=crop",
    projects: [
      {
        id: "proj6",
        name: "MVP Launch",
        logo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop",
        todos: [
          { id: "todo17", text: "Validate product idea", completed: true },
          { id: "todo18", text: "Build core features", completed: false },
          { id: "todo19", text: "Beta testing", completed: false },
          { id: "todo20", text: "Launch marketing", completed: false },
        ],
      },
    ],
  },
];