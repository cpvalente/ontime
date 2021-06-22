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

  const baseURL = `http://__IP__:${4001}`;

  const handleLink = (url) => {
    if (window.process.type === 'renderer') {
      window.ipcRenderer.send('send-to-link', url);
    }
  };

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
                    key={e.address}
                    href='#!'
                    onClick={() =>
                      handleLink(baseURL.replace('__IP__', e.address))
                    }
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
