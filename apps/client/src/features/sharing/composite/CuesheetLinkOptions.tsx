import { Fragment, RefObject, useState } from 'react';

import RadioGroup from '../../../common/components/radio-group/RadioGroup';
import Switch from '../../../common/components/switch/Switch';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { cuesheetDefaultColumns, makeCuesheetCustomColumns } from '../../../views/cuesheet/cuesheet.options';
import * as Panel from '../../app-settings/panel-utils/PanelUtils';

import style from './CuesheetLinkOptions.module.scss';

type AccessMode = 'full-read' | 'full-write' | 'custom';

interface CuesheetLinkOptionsProps {
  readRef?: RefObject<HTMLInputElement | null>;
  writeRef?: RefObject<HTMLInputElement | null>;
}

export default function CuesheetLinkOptions({ readRef, writeRef }: CuesheetLinkOptionsProps) {
  const { data } = useCustomFields();
  const customFieldColumns = makeCuesheetCustomColumns(data);
  const [accessMode, setAccessMode] = useState<AccessMode>('full-read');
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

  const handleAccessModeChange = (value: AccessMode) => {
    setAccessMode(value);
    setReadSwitches((prevReadSwitches) => {
      const updatedReadSwitches = { ...prevReadSwitches };
      setWriteSwitches((prevWriteSwitches) => {
        const updatedWriteSwitches = { ...prevWriteSwitches };
        [...cuesheetDefaultColumns, ...customFieldColumns].forEach((column) => {
          if (value === 'full-read') {
            updatedReadSwitches[column.value] = true;
            updatedWriteSwitches[column.value] = false;
          } else if (value === 'full-write') {
            updatedReadSwitches[column.value] = true;
            updatedWriteSwitches[column.value] = true;
          }
        });
        return updatedWriteSwitches;
      });
      return updatedReadSwitches;
    });
  };

  const handleSwitchChange = (key: string, type: 'read' | 'write', value: boolean) => {
    if (type === 'read') {
      setReadSwitches((prevReadSwitches) => {
        const updatedReadSwitches = { ...prevReadSwitches, [key]: value };
        checkAndSetCustomMode(updatedReadSwitches, writeSwitches);
        return updatedReadSwitches;
      });
    } else {
      setWriteSwitches((prevWriteSwitches) => {
        const updatedWriteSwitches = { ...prevWriteSwitches, [key]: value };
        checkAndSetCustomMode(readSwitches, updatedWriteSwitches);
        return updatedWriteSwitches;
      });
    }
  };

  const checkAndSetCustomMode = (readSwitches: Record<string, boolean>, writeSwitches: Record<string, boolean>) => {
    if (accessMode !== 'custom') {
      const hasCustomConfig = [...cuesheetDefaultColumns, ...customFieldColumns].some((column) => {
        if (accessMode === 'full-read') {
          return !readSwitches[column.value] || writeSwitches[column.value];
        } else if (accessMode === 'full-write') {
          return !readSwitches[column.value] || !writeSwitches[column.value];
        }
        return false;
      });

      if (hasCustomConfig) {
        setAccessMode('custom');
      }
    }
  };

  const getReadPermissions = () => {
    if (accessMode === 'full-read' || accessMode === 'full-write') {
      return 'full';
    } else {
      return Object.entries(readSwitches)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(',');
    }
  };

  const getWritePermissions = () => {
    if (accessMode === 'full-write') {
      return 'full';
    } else {
      return Object.entries(writeSwitches)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(',');
    }
  };

  return (
    <Panel.Indent>
      <input hidden ref={readRef} value={getReadPermissions()} />
      <input hidden ref={writeRef} value={getWritePermissions()} />
      <Panel.Field title='Access mode' description='Which parts of the data will the link give access to' />
      <RadioGroup
        value={accessMode}
        onValueChange={handleAccessModeChange}
        orientation='vertical'
        items={[
          { value: 'full-read', label: 'Full read (view all existing and future columns)' },
          { value: 'full-write', label: 'Full write (edit all existing and future columns)' },
          { value: 'custom', label: 'Custom (view and edit selected columns)' },
        ]}
      />
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
              />
              <Switch
                checked={Boolean(writeSwitches[column.value])}
                onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'write', value)}
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
                <div>{column.label}</div>
                <Switch
                  checked={Boolean(readSwitches[column.value])}
                  onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'read', value)}
                />
                <Switch
                  checked={Boolean(writeSwitches[column.value])}
                  onCheckedChange={(value: boolean) => handleSwitchChange(column.value, 'write', value)}
                />
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </Panel.Indent>
  );
}
