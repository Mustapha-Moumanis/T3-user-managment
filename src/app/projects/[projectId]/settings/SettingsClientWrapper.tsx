"use client";

import { ProjectConfig } from "@/components/projects/ProjectConfig";

import { AppShell } from "@/components/shell/AppShell";

export default function SettingsClientWrapper({ project }: { project: any }) {
	return (
		<ProjectConfig
			mode="edit"
			initial={project}
		/>
	);
}
