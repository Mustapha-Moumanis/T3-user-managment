"use client";

import { useRouter } from "next/navigation";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";

export default function SettingsClientWrapper({ project }: { project: any }) {
  const router = useRouter();

  return (
    <ProjectFormModal 
      mode="edit" 
      initial={project} 
      onClose={() => router.push(`/projects/${project.id}/import`)}
      inline
    />
  );
}
