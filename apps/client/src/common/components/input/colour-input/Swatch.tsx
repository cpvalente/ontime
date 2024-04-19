import { IoBan } from '@react-icons/all-files/io5/IoBan';

import { cx } from '../../../utils/styleUtils';

import style from './SwatchSelect.module.scss';

interface SwatchProps {
  color: string;
  onClick?: (color: string) => void;
  isSelected?: boolean;
}

export default function Swatch(props: SwatchProps) {
  const { color, isSelected, onClick } = props;

  const handleClick = () => {
    onClick?.(color);
  };
  const classes = cx([style.swatch, isSelected ? style.selected : null, onClick ? style.selectable : null]);

  if (!color) {
    return (
      <div className={`${classes} ${style.center}`} onClick={handleClick}>
        <IoBan />
      </div>
    );
  }

  if (color === 'unkown') {
    <div className={`${classes} ${style.center}`} onClick={handleClick}>
      ?
    </div>;
  }
  return <div className={classes} style={{ backgroundColor: `${color}` }} onClick={handleClick} />;
}
