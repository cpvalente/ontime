export type ProjectData = {
  title: string;
  description: string;
  url: string;
  info: string;
  logo: string | null;
  custom: { title: string; value: string; url: string }[];
};
