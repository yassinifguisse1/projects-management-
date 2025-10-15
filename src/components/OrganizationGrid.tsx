"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Organization } from "@/lib/data";

interface OrganizationGridProps {
  organizations: Organization[];
  onSelectOrganization: (org: Organization) => void;
}

export default function OrganizationGrid({
  organizations,
  onSelectOrganization,
}: OrganizationGridProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-12 text-center"
      >
        Select Organization
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {organizations.map((org, index) => (
          <motion.button
            key={org.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectOrganization(org)}
            className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-border"
          >
            <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden">
              <Image
                src={org.logo}
                alt={org.name}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold">{org.name}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {org.projects.length} projects
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}