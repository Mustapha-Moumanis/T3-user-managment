import { ProjectConfig } from "@/components/projects/ProjectConfig";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
	return (
		<AppShell breadcrumbs={[{ label: "Projects", href: "/" }, { label: "New Project" }]}>
			<ProjectConfig mode="create" />
		</AppShell>
	);
}
