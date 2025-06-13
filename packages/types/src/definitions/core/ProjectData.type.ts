export type ProjectData = {
  title: string;
  description: string;
  publicUrl: string; //TODO: should this also go?
  publicInfo: string;
  backstageUrl: string;
  backstageInfo: string;
  projectLogo: string | null;
  custom: { title: string; value: string }[];
};
