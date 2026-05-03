import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { notFound } from "next/navigation";
import SettingsClientWrapper from "./SettingsClientWrapper";

export default async function SettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) notFound();

  const p = { ...project, id: String(project._id) } as any;

  return (
    <div style={{ padding: "32px 24px" }}>
      <SettingsClientWrapper project={p} />
    </div>
  );
}
