import { FiX } from '@react-icons/all-files/fi/FiX';
import { Tooltip } from '@chakra-ui/tooltip';
import { stringFromMillis } from 'ontime-utils/time';
import PublicIconBtn from '../../common/components/buttons/PublicIconBtn';
import style from './Table.module.scss';

export default function OnTimeTable({ columns, data, handleHide }) {
  console.log('>>>>>>>>>>>', data);
  return (
    <div className={style.tableContainer}>
      <div className={style.rowHeader}>
        <div className={style.indexColumn} style={{ maxWidth: '1.5em' }}>
          #
        </div>
        {columns
          .filter((c) => c.visible)
          .map((c) => (
            <div style={{ maxWidth: c.width }} key={c.accessor} className={style.headerCell}>
              {c.header}
              <Tooltip label='Hide field' openDelay={300}>
                <span className={style.actionIcon} onClick={() => handleHide(c.accessor)}>
                  <FiX />
                </span>
              </Tooltip>
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
            <div className={style.indexColumn} style={{ maxWidth: '1.5em' }}>
              {index * 1}
            </div>
            <div className={style.column} style={{ maxWidth: '1.5em' }}>
              {d.type === 'event' ? 'E' : d.type === 'block' ? 'B' : 'D'}
            </div>
            {d.timeStart !== undefined && (
              <div className={style.column} style={{ maxWidth: '6em' }}>
                {stringFromMillis(d.timeStart)}
              </div>
            )}
            {d.timeEnd !== undefined && (
              <div className={style.column} style={{ maxWidth: '6em' }}>
                {stringFromMillis(d.timeEnd)}
              </div>
            )}
            {d.duration !== undefined && (
              <div className={style.column} style={{ maxWidth: '6em' }}>
                {stringFromMillis(d.duration)}
              </div>
            )}
            {d.title !== undefined && (
              <div className={style.column} style={{ maxWidth: '10em' }}>
                {d.title || '--'}
              </div>
            )}
            {d.subtitle !== undefined && (
              <div className={style.column} style={{ maxWidth: '10em' }}>
                {d.subtitle || '--'}
              </div>
            )}
            {d.presenter !== undefined && (
              <div className={style.column} style={{ maxWidth: '10em' }}>
                {d.presenter || '--'}
              </div>
            )}
            {d.note !== undefined && (
              <div className={style.column} style={{ maxWidth: '10em' }}>
                {d.note || '--'}
              </div>
            )}
            {d.isPublic !== undefined && (
              <div className={style.column} style={{ maxWidth: '2em' }}>
                <PublicIconBtn active={d.isPublic} />
              </div>
            )}
            {d.light !== undefined && (
              <div className={style.column} style={{ maxWidth: 'auto' }}>
                --
              </div>
            )}
            {d.cam !== undefined && (
              <div className={style.column} style={{ maxWidth: 'auto' }}>
                --
              </div>
            )}
            {d.video !== undefined && (
              <div className={style.column} style={{ maxWidth: 'auto' }}>
                --
              </div>
            )}
            {d.audio !== undefined && (
              <div className={style.column} style={{ maxWidth: 'auto' }}>
                --
              </div>
            )}
            {d.colour !== undefined && (
              <div className={style.column} style={{ maxWidth: '5em' }}>
                {'#FFFFFF' || '--'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
