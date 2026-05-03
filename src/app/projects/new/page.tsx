import { ProjectWizard } from "@/components/projects/ProjectWizard";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Projects", href: "/" }, { label: "New Project" }]}>
      <ProjectWizard mode="create" />
    </AppShell>
  );
}
