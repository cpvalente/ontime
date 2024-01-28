import { CustomFieldDefinitions } from './CustomFields .type.js';

export type ProjectData = {
  title: string;
  description: string;
  publicUrl: string;
  publicInfo: string;
  backstageUrl: string;
  backstageInfo: string;
  customFields: CustomFieldDefinitions;
};
