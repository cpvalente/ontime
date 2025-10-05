import { MouseEvent } from 'react';
import { IoBan } from 'react-icons/io5';

import { cx } from '../../../utils/styleUtils';

import style from './SwatchSelect.module.scss';

interface SwatchProps {
  color: string;
  onClick?: (color: string) => void;
  isSelected?: boolean;
}

export default function Swatch({ color, isSelected, onClick }: SwatchProps) {
  const handleClick = (event: MouseEvent) => {
    onClick?.(color);
    event.preventDefault();
    event.stopPropagation();
  };

  const classes = cx([style.swatch, isSelected && style.selected, onClick && style.selectable]);

  if (!color) {
    return (
      <div className={classes} onClick={handleClick}>
        <IoBan />
      </div>
    );
  }
  return <div className={classes} style={{ backgroundColor: `${color}` }} onClick={handleClick} />;
}
