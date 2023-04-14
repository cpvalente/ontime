import { IoBan } from '@react-icons/all-files/io5/IoBan';

import { cx } from '../../../utils/styleUtils';

import style from './SwatchSelect.module.scss';

interface SwatchProps {
  color: string;
  onClick: (color: string) => void;
  isSelected?: boolean;
}

export default function Swatch(props: SwatchProps) {
  const { color, isSelected, onClick } = props;

  const classes = cx([style.swatch, isSelected ? style.selected : null]);

  if (!color) {
    return (
      <div className={`${classes} ${style.center}`} onClick={() => onClick('')}>
        <IoBan />
      </div>
    );
  }
  return <div className={classes} style={{ backgroundColor: `${color}` }} onClick={() => onClick(color)} />;
}
