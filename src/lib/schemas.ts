import { z } from "zod";

export const FieldDefSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "number", "array"]).default("string"),
  required: z.boolean().default(false),
});

export type FieldDef = z.infer<typeof FieldDefSchema>;

export const EndpointSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  method: z.string().optional(),
  path: z.string(),
  importMode: z.enum(["per-row", "bulk-file"]).default("per-row"),
  emailDomainAllowlist: z.array(z.string()).optional(),
  requiredFields: z.array(FieldDefSchema).default([]),
  optionalFields: z.array(FieldDefSchema).default([]),
  savedMapping: z.record(z.string(), z.string()).optional(),
});

export type ProjectEndpoint = z.infer<typeof EndpointSchema>;

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
    tokenUrl: z.string().optional(),
    clientId: z.string().optional(),
  }).optional(),
  endpoints: z.array(EndpointSchema).optional(),
});

export type ProjectFormValues = z.infer<typeof ProjectFormSchema>;
