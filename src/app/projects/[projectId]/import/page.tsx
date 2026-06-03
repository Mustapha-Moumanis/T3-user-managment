import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { notFound } from "next/navigation";
import { ImportClient } from "./ImportClient";

export default async function ImportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) notFound();

  const p = JSON.parse(JSON.stringify({ ...project, id: String(project._id), endpoints: project.endpoints ?? [] }));

  const globalAllowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
    ? process.env.ALLOWED_EMAIL_DOMAINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return <ImportClient project={p} globalAllowedDomains={globalAllowedDomains} />;
}
