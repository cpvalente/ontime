import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { Tooltip } from '@chakra-ui/tooltip';
import style from './Table.module.scss';
import { stringFromMillis } from 'ontime-utils/time';
import { Textarea } from '@chakra-ui/react';
import EditableText from '../../common/input/EditableText';
import PropTypes from 'prop-types';

export default function OntimeTable({ columns, data, handleHide }) {
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
      case 'textArea': {
        return (
          <Textarea
            size='sm'
            borderColor='#0001'
            value={value}
            placeholder={`${options.header} notes`}
          />
        );
      }
      default:
        return value;
    }
  };

  console.log('>>>>>>>>>>>>>>>>', data)

  return (
    <div className={style.tableContainer}>
      <div className={style.rowHeader}>
        <div className={style.indexColumn} style={{ maxWidth: '1.5em' }}>
          #
        </div>
        {columns
          .filter((c) => c.visible)
          .map((c) => (
            <div className={style.headerCell} style={{ minWidth: c.width }} key={c.accessor} >
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
            key={d.id}
          >
            <div className={style.indexColumn} style={{ width: '1em' }}>
              {index * 1}
            </div>
            {columns
              .filter((c) => c.visible)
              .map((c) => (
                <div key={c.accessor} className={style.column} style={{ minWidth: c.width, backgroundColor: d.colour || 'none' }}>
                  {parseType(c.type, d[c.accessor], { maxchar: d?.maxchar, header: c.header })}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

OntimeTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array,
  handleHide: PropTypes.func.isRequired,
};
