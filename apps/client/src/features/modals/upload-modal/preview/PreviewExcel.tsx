import { CustomFields, OntimeRundown } from 'ontime-types';

import PreviewRundown from './PreviewRundown';

import style from '../../Modal.module.scss';

interface PreviewExcelProps {
  rundown: OntimeRundown;
  customFields: CustomFields;
}

export default function PreviewExcel(props: PreviewExcelProps) {
  const { rundown, customFields } = props;

  return (
    <div className={`${style.column}`}>
      <div className={style.title}>Review Rundown</div>
      <PreviewRundown rundown={rundown} customFields={customFields} />
    </div>
  );
}
