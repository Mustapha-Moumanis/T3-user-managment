"use client";

import { ProjectWizard } from "@/components/projects/ProjectWizard";

import { AppShell } from "@/components/shell/AppShell";

export default function SettingsClientWrapper({ project }: { project: any }) {
  return (
    <AppShell 
      breadcrumbs={[
        { label: "Projects", href: "/" }, 
        { label: project.name, href: `/projects/${project.id}/import` },
        { label: "Settings" }
      ]}
    >
      <ProjectWizard 
        mode="edit" 
        initial={project} 
      />
    </AppShell>
  );
}
