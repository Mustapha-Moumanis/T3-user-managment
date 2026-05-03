"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/lib/models/Project";
import { ProjectFormSchema, type ProjectFormValues } from "@/lib/schemas";

export async function createProject(data: ProjectFormValues) {
  await connectDB();
  const parsed = ProjectFormSchema.parse(data);
  const p = await Project.create(parsed);
  revalidatePath("/");
  return String(p._id);
}

export async function updateProject(id: string, data: ProjectFormValues) {
  await connectDB();
  const parsed = ProjectFormSchema.parse(data);
  await Project.findByIdAndUpdate(id, parsed);
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  await connectDB();
  await Project.findByIdAndDelete(id);
  revalidatePath("/");
}

export async function starProject(id: string, starred: boolean) {
  await connectDB();
  await Project.findByIdAndUpdate(id, { starred });
  revalidatePath("/");
}
