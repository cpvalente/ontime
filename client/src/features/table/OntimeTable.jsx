import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { Tooltip } from '@chakra-ui/tooltip';
import style from './Table.module.scss';
import { stringFromMillis } from 'ontime-utils/time';
import EditableText from '../../common/input/EditableText';

export default function OnTimeTable({ columns, filter, data, handleHide }) {
  console.log('>>>>>>>>>>>>>>', filter);
  /**
   * Returns appropriate render object from a given type
   * @param type
   * @param value
   * @param options
   * @returns {JSX.Element|string|*}
   */
  const parseType = (type, value, options) => {
    switch (type) {
      case 'short': {
        return value[0].toUpperCase();
      }
      case 'millis': {
        return stringFromMillis(value);
      }
      case 'bool': {
        return value ? <FiCheck /> : <FiX />;
      }
      case 'editable': {
        return (
          <EditableText
            defaultValue={value}
            maxchar={options?.maxchar}
            placeholder='No value set'
            submitHandler={() => undefined}
          />
        );
      }
      default:
        return value;
    }
  };

  return (
    <div className={style.tableContainer}>
      <div className={style.rowHeader}>
        <div className={style.indexColumn} style={{ maxWidth: '1.5em' }}>
          #
        </div>
        {columns
          .filter((c) => c.visible)
          .map((c) => (
            <div style={{ width: c.width }} key={c.accessor} className={style.headerCell}>
              {c.header}
              {c.filterable && (
                <Tooltip label='Hide field' openDelay={300}>
                  <span className={style.actionIcon} onClick={() => handleHide(c.accessor)}>
                    <FiX />
                  </span>
                </Tooltip>
              )}
            </div>
          ))}
      </div>
      <div className={style.tableBody}>
        {data.map((d, index) => (
          <div
            className={index === 3 ? style.rowNow : style.row}
            style={{ backgroundColor: d.color || 'unset' }}
            key={d.id}
          >
            <div className={style.indexColumn} style={{ width: '1em' }}>
              {index * 1}
            </div>
            {columns
              .filter((c) => c.visible)
              .map((c) => (
                <div key={c.accessor} className={style.column} style={{ width: c.width }}>
                  {parseType(c.type, d[c.accessor], { maxchar: d?.maxchar })}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
