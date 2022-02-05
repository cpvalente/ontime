import { FiX } from '@react-icons/all-files/fi/FiX';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { Tooltip } from '@chakra-ui/tooltip';
import { Textarea } from '@chakra-ui/react';
import style from './Table.module.scss';
import { stringFromMillis } from 'ontime-utils/time';
import PropTypes from 'prop-types';
import { requestPatch } from '../../app/api/eventsApi';
import { useMutation } from 'react-query';

export default function OntimeTable({ columns, data, handleHide, selectedId }) {
  const mutation = useMutation(requestPatch);

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
      case 'textArea': {
        return (
          <Textarea
            size='sm'
            borderColor='#0001'
            defaultValue={value}
            placeholder={`${options.header} notes`}
            onBlur={(e) => handleSubmit(options?.accessor, options?.id, e.target.value)}
          />
        );
      }
      default:
        return value;
    }
  };

  const handleSubmit = async (accessor, id, payload) => {
    console.log('1', accessor, id, payload);
    if (accessor == null || id == null || payload == null) {
      return;
    }

    // check if value is the same
    const event = data.find((d) => d.id === id);
    console.log('2', event);
    if (event === undefined) {
      return;
    }

    console.log('3', event[accessor]);
    if (event[accessor] === payload) {
      return;
    }
    console.log('4', typeof payload);
    // check if value is valid
    // as of now, the fields do not have any validation
    if (typeof payload !== 'string') {
      return;
    }

    // cleanup
    const cleanVal = payload.trim();
    console.log('5', cleanVal);
    const mutationObject = {
      id,
      [accessor]: cleanVal,
    };

    console.log('6', mutationObject)
    // submit
    try {
      await mutation.mutateAsync(mutationObject);
    } catch (error) {
      console.error(error);
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
            <div className={style.headerCell} style={{ minWidth: c.width }} key={c.accessor}>
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
          <div className={d.id === selectedId ? style.rowNow : style.row} key={d.id}>
            <div
              className={d.id === selectedId ? style.indexColumnNow : style.indexColumn}
              style={{ width: '1em' }}
            >
              {index * 1}
            </div>
            {columns
              .filter((c) => c.visible)
              .map((c) => (
                <div
                  key={c.accessor}
                  className={style.column}
                  style={{ minWidth: c.width, backgroundColor: d.colour || 'none' }}
                >
                  {parseType(c.type, d[c.accessor], {
                    id: d.id,
                    accessor: c.accessor,
                    maxchar: d?.maxchar,
                    header: c.header,
                  })}
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
  selectedId: PropTypes.string,
};
