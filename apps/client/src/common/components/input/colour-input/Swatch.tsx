import { IoBan } from 'react-icons/io5';

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
