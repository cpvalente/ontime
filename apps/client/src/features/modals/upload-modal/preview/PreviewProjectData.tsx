import { ProjectData } from 'ontime-types';

import style from './PreviewColumn.module.scss';

interface PreviewProjectDataProps {
  project: ProjectData;
}

export default function PreviewProjectData({ project }: PreviewProjectDataProps) {
  return (
    <div className={style.previewTable}>
      <span className={style.field}>Title</span>
      <span className={style.value}>{project.title}</span>
      <span className={style.field}>Description</span>
      <span className={style.value}>{project.description}</span>
      <span className={style.field}>Public URL</span>
      <span className={style.value}>{project.publicUrl}</span>
      <span className={style.field}>Public info</span>
      <span className={style.value}>{project.publicInfo}</span>
      <span className={style.field}>Backstage URL</span>
      <span className={style.value}>{project.backstageUrl}</span>
      <span className={style.field}>Backstage info</span>
      <span className={style.value}>{project.backstageInfo}</span>
    </div>
  );
}
