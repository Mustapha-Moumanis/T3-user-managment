import type { ProjectEndpoint } from './schemas';

export interface ProjectAuth {
  type?: string;
  value?: string;
  headerName?: string;
  username?: string;
  tokenUrl?: string;
  clientId?: string;
}

export interface ProjectDto {
  id: string;
  _id?: string;
  name: string;
  description: string;
  color: string;
  starred: boolean;
  baseUrl: string;
  auth: ProjectAuth;
  endpoints: ProjectEndpoint[];
}
