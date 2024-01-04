import { z } from 'zod';

export const ProjectDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  publicUrl: z.string(),
  publicInfo: z.string(),
  backstageUrl: z.string(),
  backstageInfo: z.string(),
});

export type ProjectData = {
  title: string;
  description: string;
  publicUrl: string;
  publicInfo: string;
  backstageUrl: string;
  backstageInfo: string;
};
