import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectButton } from "@/components/projects/NewProjectButton";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { AppShell } from "@/components/shell/AppShell";
import { ProjectWizard } from "@/components/projects/ProjectWizard";

export const dynamic = "force-dynamic";

async function getProjects() {
  await connectDB();
  const projects = await Project.find().sort({ starred: -1, updatedAt: -1 }).lean();
  return projects.map((p) => ({
    id: String(p._id),
    name: p.name,
    description: p.description || "",
    color: p.color || "dodgerBlue",
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
    <AppShell breadcrumbs={[{ label: "Projects" }]}>
      <section>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <h1 className="page-title-xl" style={{ fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
              Projects
            </h1>
            <div className="page-subtitle" style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>
              Select a project to start importing, or create a new one.
            </div>
          </div>
          <NewProjectButton />
        </div>
      </section>

      <section>
        {projects.length === 0 ? (
          <div className="card empty" style={{ marginTop: 16, padding: "48px 24px" }}>
            <div style={{ width: 70, height: 70, borderRadius: 999, background: "color-mix(in srgb, var(--text) 6%, transparent)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>No projects yet</div>
            <div style={{ color: "var(--text-3)", maxWidth: 380, margin: "0 auto 16px", textAlign: "center" }}>
              Create a project to save your API connection and credentials. Once saved, importing users takes just a few clicks.
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
            gridAutoRows: "1fr",
          }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
            <NewProjectButton variant="card" />
          </div>
        )}
      </section>
    </AppShell>
  );
}
