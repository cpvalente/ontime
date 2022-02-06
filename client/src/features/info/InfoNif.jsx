import React, { useState } from 'react';
import { APP_TABLE } from 'app/api/apiConstants';
import { getInfo, ontimePlaceholderInfo } from 'app/api/ontimeApi';
import { useFetch } from 'app/hooks/useFetch';
import style from './Info.module.scss';
import CollapseBar from '../../common/components/collapseBar/CollapseBar';
import handleLink from '../../common/utils/handleLink';

export default function InfoNif() {
  const { data, status } = useFetch(APP_TABLE, getInfo, {
    placeholderData: ontimePlaceholderInfo,
  });
  const [collapsed, setCollapsed] = useState(false);
  const baseURL = 'http://__IP__:4001';

  return (
  <div className={style.container}>
    <CollapseBar title={'Network Info'} isCollapsed={collapsed} onClick={() => setCollapsed((c) => !c)}/>
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
