import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AuthSchema = new Schema(
  {
    type: { type: String, default: "bearer" },
    value: { type: String },
    headerName: { type: String },
    username: { type: String },
    password: { type: String },
    tokenUrl: { type: String },
    clientId: { type: String },
  },
  { _id: false }
);

const EndpointSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String },
    method: { type: String, default: "POST" },
    path: { type: String, required: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    color: { type: String, default: "dodgerBlue" }, // Used for accent preset
    starred: { type: Boolean, default: false },
    baseUrl: { type: String, default: "" },
    auth: { type: AuthSchema, default: () => ({}) },
    endpoints: { type: [EndpointSchema], default: [] },
  },
  { timestamps: true }
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: unknown; updatedAt: Date };

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) || model<ProjectDoc>("Project", ProjectSchema);
