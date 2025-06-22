export type ProjectData = {
  title: string;
  description: string;
  backstageUrl: string;
  backstageInfo: string;
  projectLogo: string | null;
  custom: { title: string; value: string }[];
};
