import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/t3-users';

const AuthSchema = new mongoose.Schema({ type: String, value: String, headerName: String, username: String }, { _id: false });

const FieldDefSchema = new mongoose.Schema(
  { key: String, label: String, type: { type: String, default: 'string' }, required: { type: Boolean, default: false } },
  { _id: false },
);

const EndpointSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    method: { type: String, default: 'POST' },
    path: String,
    importMode: { type: String, default: 'per-row' },
    emailDomainAllowlist: [String],
    requiredFields: [FieldDefSchema],
    optionalFields: [FieldDefSchema],
    savedMapping: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const ProjectSchema = new mongoose.Schema(
  { name: String, description: String, color: String, starred: Boolean, baseUrl: String, auth: AuthSchema, endpoints: [EndpointSchema] },
  { timestamps: true },
);

const Project = mongoose.models.Project ?? mongoose.model('Project', ProjectSchema);

const compostageProject = {
  name: 'Compostage',
  description: 'Bulk user import for the compostage exam platform',
  color: 'emerald',
  starred: true,
  baseUrl: 'http://localhost:3000/api',
  auth: { type: 'bearer', value: '' },
  endpoints: [
    {
      id: 'createCorrector',
      label: 'Correcteur',
      method: 'POST',
      path: '/authenticate/createCorrector',
      emailDomainAllowlist: ['men.gov.ma'],
      requiredFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'name', label: 'Full Name', type: 'string', required: true },
        { key: 'codeCentre', label: 'Code Centre', type: 'string', required: true },
        { key: 'matieres', label: 'Matières', type: 'array', required: true },
        { key: 'phone', label: 'Phone Number', type: 'string', required: true },
      ],
      optionalFields: [],
    },
    {
      id: 'createAref',
      label: 'Responsable SI',
      method: 'POST',
      path: '/importResponsablesSi',
      importMode: 'bulk-file',
      emailDomainAllowlist: ['men.gov.ma'],
      requiredFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'name', label: 'Full Name', type: 'string', required: true },
        { key: 'codeAref', label: 'Code AREF', type: 'string', required: true },
        { key: 'phone', label: 'Phone Number', type: 'string', required: true },
      ],
      optionalFields: [],
    },
    {
      id: 'createChefCorrection',
      label: 'Chef de Correction',
      method: 'POST',
      path: '/authenticate/createChefCorrection',
      emailDomainAllowlist: ['men.gov.ma'],
      requiredFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'name', label: 'Full Name', type: 'string', required: true },
        { key: 'codeCentre', label: 'Code Centre', type: 'string', required: true },
        { key: 'codeAref', label: 'Code AREF', type: 'string', required: true },
        { key: 'phone', label: 'Phone Number', type: 'string', required: true },
      ],
      optionalFields: [],
    },
    {
      id: 'createResponsableCentre',
      label: 'Responsable Centre Examen',
      method: 'POST',
      path: '/importResponsablesCentreExamen',
      emailDomainAllowlist: ['men.gov.ma'],
      requiredFields: [
        { key: 'email', label: 'Email', type: 'string', required: true },
        { key: 'name', label: 'Full Name', type: 'string', required: true },
        { key: 'codeCentre', label: 'Code Centre', type: 'string', required: true },
        { key: 'phone', label: 'Phone Number', type: 'string', required: true },
      ],
      optionalFields: [],
    },
  ],
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await Project.findOne({ name: 'Compostage' });
  if (existing) {
    await Project.replaceOne({ _id: existing._id }, compostageProject);
    console.log(`Replaced existing Compostage project (id: ${existing._id})`);
  } else {
    const created = await Project.create(compostageProject);
    console.log(`Created Compostage project (id: ${created._id})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => { console.error(err); process.exit(1); });
