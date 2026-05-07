import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { AppShell } from "@/components/shell/AppShell";
import { ProjectsClient } from "@/components/projects/ProjectsClient";

export const dynamic = "force-dynamic";

async function getProjects() {
  await connectDB();
  const projects = await Project.find().sort({ starred: -1, updatedAt: -1 }).lean();
  return projects.map((p) => ({
    id: String(p._id),
    name: p.name,
    description: p.description || "",
    color: p.color || "indigo",
    starred: !!p.starred,
    baseUrl: p.baseUrl || "",
    auth: p.auth || {},
    endpoints: p.endpoints || [],
    updatedAt: p.updatedAt,
  }));
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <AppShell maxWidth={1180}>
      <ProjectsClient projects={projects} />
    </AppShell>
  );
}
