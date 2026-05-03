import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import SettingsClientWrapper from "./SettingsClientWrapper";

export default async function SettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) notFound();

  const p = JSON.parse(JSON.stringify({ ...project, id: String(project._id) }));

  return (
    <AppShell breadcrumbs={[{ label: "Projects", href: "/" }, { label: project.name, href: `/projects/${projectId}/import` }, { label: "Settings" }]}>
      <SettingsClientWrapper project={p} />
    </AppShell>
  );
}
