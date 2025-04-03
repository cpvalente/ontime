export type ProjectData = {
  title: string;
  description: string;
  publicUrl: string;
  publicInfo: string;
  backstageUrl: string;
  backstageInfo: string;
  projectLogo: string | null;
  custom: { title: string; value: string }[];
};
