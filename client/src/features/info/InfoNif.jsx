import { Icon } from '@chakra-ui/react';
import { useState } from 'react';
import { FiChevronUp } from 'react-icons/fi';
import { APP_TABLE } from 'app/api/apiConstants';
import { getInfo, ontimePlaceholderInfo } from 'app/api/ontimeApi';
import { useFetch } from 'app/hooks/useFetch';
import style from './Info.module.css';

export default function InfoNif() {
  const { data, status } = useFetch(APP_TABLE, getInfo, {
    placeholderData: ontimePlaceholderInfo,
  });
  const [collapsed, setCollapsed] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';
  const baseURL = `http://__IP__:${isDev ? 3000 : 4001}`;

  return (
    <div className={style.container}>
      <div className={style.header}>
        Network Info
        <Icon
          className={collapsed ? style.moreCollapsed : style.moreExpanded}
          as={FiChevronUp}
          onClick={() => setCollapsed((c) => !c)}
        />
      </div>

      {!collapsed && (
        <div>
          {status === 'success' && (
            <>
              {data?.networkInterfaces.map((e) => {
                return (
                  <a
                    href={baseURL.replace('__IP__', e.address)}
                    target='_blank'
                    rel='noreferrer'
                    className={style.if}
                  >{`${e.name} - ${e.address}`}</a>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
