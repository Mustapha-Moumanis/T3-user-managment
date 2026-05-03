import { z } from "zod";

export const ProjectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  baseUrl: z.string().optional(),
  auth: z.object({
    type: z.string().optional(),
    value: z.string().optional(),
    headerName: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    tokenUrl: z.string().optional(),
    clientId: z.string().optional(),
  }).optional(),
  endpoints: z.array(z.object({
    id: z.string(),
    label: z.string().optional(),
    method: z.string().optional(),
    path: z.string(),
  })).optional(),
});

export type ProjectFormValues = z.infer<typeof ProjectFormSchema>;
