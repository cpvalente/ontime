import { Fragment, RefObject, useMemo, useState } from 'react';

import RadioGroup from '../../../common/components/radio-group/RadioGroup';
import Switch from '../../../common/components/switch/Switch';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { cuesheetDefaultColumns, makeCuesheetCustomColumns } from '../../../views/cuesheet/cuesheet.options';
import * as Panel from '../../app-settings/panel-utils/PanelUtils';

import style from './CuesheetLinkOptions.module.scss';

type AccessMode = 'full' | 'custom';

interface CuesheetLinkOptionsProps {
  readRef?: RefObject<HTMLInputElement | null>;
  writeRef?: RefObject<HTMLInputElement | null>;
}

export default function CuesheetLinkOptions({ readRef, writeRef }: CuesheetLinkOptionsProps) {
  const { data } = useCustomFields();
  const customFieldColumns = useMemo(() => makeCuesheetCustomColumns(data), [data]);

  const [readPermissions, setReadPermissions] = useState<AccessMode>('full');
  const [writePermissions, setWritePermissions] = useState<AccessMode>('full');

  const [readSwitches, setReadSwitches] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    [...cuesheetDefaultColumns, ...customFieldColumns].forEach((column) => {
      initialState[column.value] = true;
    });
    return initialState;
  });

  const [writeSwitches, setWriteSwitches] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    [...cuesheetDefaultColumns, ...customFieldColumns].forEach((column) => {
      initialState[column.value] = false;
    });
    return initialState;
  });

  const handleAccessModeChange = (permissions: 'read' | 'write', value: AccessMode) => {
    if (permissions === 'read') {
      setReadPermissions(value);
      if (value === 'full') {
        setReadSwitches((prevReadSwitches) => {
          const updatedReadSwitches = { ...prevReadSwitches };
          Object.keys(updatedReadSwitches).forEach((key) => {
            updatedReadSwitches[key] = true;
          });
          return updatedReadSwitches;
        });
      }
    } else {
      setWritePermissions(value);
      if (value === 'full') {
        setReadPermissions('full');
        setReadSwitches((prevReadSwitches) => {
          const updatedReadSwitches = { ...prevReadSwitches };
          setWriteSwitches((prevWriteSwitches) => {
            const updatedWriteSwitches = { ...prevWriteSwitches };
            [...cuesheetDefaultColumns, ...customFieldColumns].forEach((column) => {
              updatedReadSwitches[column.value] = true;
              updatedWriteSwitches[column.value] = true;
            });
            return updatedWriteSwitches;
          });
          return updatedReadSwitches;
        });
      }
    }
  };

  const handleSwitchChange = (key: string, type: 'read' | 'write', value: boolean) => {
    if (type === 'read') {
      setReadSwitches((prevReadSwitches) => {
        const updatedReadSwitches = { ...prevReadSwitches, [key]: value };
        return updatedReadSwitches;
      });
    } else {
      setWriteSwitches((prevWriteSwitches) => {
        const updatedWriteSwitches = { ...prevWriteSwitches, [key]: value };
        return updatedWriteSwitches;
      });
    }
  };

  const getReadPermissions = () => {
    if (readPermissions === 'full' || writePermissions === 'full') {
      return 'full';
    }

    return Object.entries(readSwitches)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(',');
  };

  const getWritePermissions = () => {
    if (writePermissions === 'full') {
      return 'full';
    }

    return Object.entries(writeSwitches)
      .filter(([_, value]) => value)
      .map(([key]) => key)
      .join(',');
  };

  return (
    <Panel.Indent>
      <input name='read' hidden readOnly ref={readRef} value={getReadPermissions() || '-'} />
      <input name='write' hidden readOnly ref={writeRef} value={getWritePermissions() || '-'} />
      <div>
        <Panel.Field title='Access mode' description='Which parts of the data will the link give access to' />
        <div>
          <RadioGroup
            value={writePermissions}
            onValueChange={(value) => handleAccessModeChange('write', value)}
            orientation='horizontal'
            items={[
              { value: 'full', label: 'Full write (edit all existing and future columns)' },
              { value: 'custom', label: 'Custom write' },
            ]}
          />
          <RadioGroup
            value={readPermissions}
            onValueChange={(value) => handleAccessModeChange('read', value)}
            orientation='horizontal'
            disabled={writePermissions === 'full'}
            items={[
              { value: 'full', label: 'Full read (view all existing and future columns)' },
              { value: 'custom', label: 'Custom read' },
            ]}
          />
        </div>
      </div>
      <div className={style.twoCols}>
        <div className={style.grid}>
          <Panel.Description>Ontime columns</Panel.Description>
          <Panel.Description>Read</Panel.Description>
          <Panel.Description>Write</Panel.Description>
          {cuesheetDefaultColumns.map((column) => (
            <Fragment key={column.value}>
              <div>{column.label}</div>
              <Switch
                checked={Boolean(readSwitches[column.value])}
                onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'read', value)}
                disabled={readPermissions === 'full' || writePermissions === 'full'}
              />
              <Switch
                checked={Boolean(writeSwitches[column.value])}
                onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'write', value)}
                disabled={writePermissions === 'full'}
              />
            </Fragment>
          ))}
        </div>
        {customFieldColumns.length > 0 && (
          <div className={style.grid}>
            <Panel.Description>Custom fields</Panel.Description>
            <Panel.Description>Read</Panel.Description>
            <Panel.Description>Write</Panel.Description>
            {customFieldColumns.map((column) => (
              <Fragment key={column.value}>
                {column.label}
                <Switch
                  checked={Boolean(readSwitches[column.value])}
                  onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'read', value)}
                  disabled={readPermissions === 'full' || writePermissions === 'full'}
                />
                <Switch
                  checked={Boolean(writeSwitches[column.value])}
                  onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'write', value)}
                  disabled={writePermissions === 'full'}
                />
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </Panel.Indent>
  );
}
