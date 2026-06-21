import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import RadioGroup from '../../../common/components/radio-group/RadioGroup';
import Switch from '../../../common/components/switch/Switch';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { cuesheetDefaultColumns, makeCuesheetCustomColumns } from '../../../views/cuesheet/cuesheet.options';
import * as Panel from '../../app-settings/panel-utils/PanelUtils';

import style from './CuesheetLinkOptions.module.scss';

type AccessMode = 'full' | 'custom';

export interface CuesheetPermissionValues {
  read: string;
  write: string;
}

interface CuesheetLinkOptionsProps {
  /** Existing read permission to seed the form with ('full' | '-' | comma separated keys) */
  initialRead?: string;
  /** Existing write permission to seed the form with ('full' | '-' | comma separated keys) */
  initialWrite?: string;
  /** Notifies the parent whenever the resolved read/write permissions change */
  onChange: (permissions: CuesheetPermissionValues) => void;
}

/** A null result means "full or unset" - there is no explicit per-column selection to seed */
function parseKeys(permission: string | undefined): Set<string> | null {
  if (permission == null || permission === 'full' || permission === '-') {
    return null;
  }
  return new Set(permission.split(','));
}

function modeFromPermission(permission: string | undefined): AccessMode {
  return permission == null || permission === 'full' ? 'full' : 'custom';
}

export default function CuesheetLinkOptions({ initialRead, initialWrite, onChange }: CuesheetLinkOptionsProps) {
  const { data } = useCustomFields();
  const customFieldColumns = useMemo(() => makeCuesheetCustomColumns(data), [data]);
  const allColumns = useMemo(() => [...cuesheetDefaultColumns, ...customFieldColumns], [customFieldColumns]);

  // Parsed seed values - stable for the lifetime of a given preset
  const initialReadKeys = useMemo(() => parseKeys(initialRead), [initialRead]);
  const initialWriteKeys = useMemo(() => parseKeys(initialWrite), [initialWrite]);

  const [readPermissions, setReadPermissions] = useState<AccessMode>(() => modeFromPermission(initialRead));
  const [writePermissions, setWritePermissions] = useState<AccessMode>(() => modeFromPermission(initialWrite));

  // Default for a column we have not seen yet: honour the seed in custom mode, otherwise grant access
  const defaultRead = useCallback((key: string) => (initialReadKeys ? initialReadKeys.has(key) : true), [
    initialReadKeys,
  ]);
  const defaultWrite = useCallback((key: string) => (initialWriteKeys ? initialWriteKeys.has(key) : true), [
    initialWriteKeys,
  ]);

  const [readSwitches, setReadSwitches] = useState<Record<string, boolean>>({});
  const [writeSwitches, setWriteSwitches] = useState<Record<string, boolean>>({});

  // Custom fields load asynchronously, so reconcile the switch maps whenever the column list grows.
  // Newly seen columns are seeded from the initial values (or default to on for a fresh link).
  useEffect(() => {
    setReadSwitches((prev) => {
      const next = { ...prev };
      for (const column of allColumns) {
        if (!(column.value in next)) next[column.value] = defaultRead(column.value);
      }
      return next;
    });
    setWriteSwitches((prev) => {
      const next = { ...prev };
      for (const column of allColumns) {
        if (!(column.value in next)) next[column.value] = defaultWrite(column.value);
      }
      return next;
    });
  }, [allColumns, defaultRead, defaultWrite]);

  const isReadOn = (key: string) => readSwitches[key] ?? defaultRead(key);
  const isWriteOn = (key: string) => writeSwitches[key] ?? defaultWrite(key);

  const handleReadModeChange = (value: AccessMode) => {
    setReadPermissions(value);
  };

  const handleWriteModeChange = (value: AccessMode) => {
    setWritePermissions(value);
    // Full write implies full read
    if (value === 'full') {
      setReadPermissions('full');
    }
  };

  const handleReadSwitch = (key: string, value: boolean) => {
    setReadSwitches((prev) => ({ ...prev, [key]: value }));
    // A column the recipient cannot read cannot be written either
    if (!value) {
      setWriteSwitches((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleWriteSwitch = (key: string, value: boolean) => {
    setWriteSwitches((prev) => ({ ...prev, [key]: value }));
    // Granting write access requires read access
    if (value) {
      setReadSwitches((prev) => ({ ...prev, [key]: true }));
    }
  };

  const resolvedRead = useMemo(() => {
    if (readPermissions === 'full' || writePermissions === 'full') {
      return 'full';
    }
    const keys = allColumns.filter((column) => isReadOn(column.value)).map((column) => column.value);
    return keys.length ? keys.join(',') : '-';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readPermissions, writePermissions, readSwitches, allColumns]);

  const resolvedWrite = useMemo(() => {
    if (writePermissions === 'full') {
      return 'full';
    }
    const keys = allColumns.filter((column) => isWriteOn(column.value)).map((column) => column.value);
    return keys.length ? keys.join(',') : '-';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writePermissions, writeSwitches, allColumns]);

  // Notify the parent of the resolved permissions. onChange is expected to be stable.
  useEffect(() => {
    onChange({ read: resolvedRead, write: resolvedWrite });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedRead, resolvedWrite]);

  const noReadAccess = resolvedRead === '-';

  const renderColumn = (column: { value: string; label: string }) => (
    <Fragment key={column.value}>
      <div>{column.label}</div>
      <Switch
        checked={isReadOn(column.value)}
        onCheckedChange={(value: boolean) => handleReadSwitch(column.value, value)}
        disabled={readPermissions === 'full' || writePermissions === 'full'}
        data-testid={`read-${column.value}`}
      />
      <Switch
        checked={isWriteOn(column.value)}
        onCheckedChange={(value: boolean) => handleWriteSwitch(column.value, value)}
        disabled={writePermissions === 'full'}
        data-testid={`write-${column.value}`}
      />
    </Fragment>
  );

  return (
    <Panel.Indent>
      <div>
        <Panel.Field title='Access mode' description='Which parts of the data the link gives access to' />
        <div>
          <RadioGroup
            value={readPermissions}
            onValueChange={handleReadModeChange}
            orientation='horizontal'
            disabled={writePermissions === 'full'}
            items={[
              { value: 'full', label: 'View all columns' },
              { value: 'custom', label: 'Choose what to view' },
            ]}
          />
          <RadioGroup
            value={writePermissions}
            onValueChange={handleWriteModeChange}
            orientation='horizontal'
            items={[
              { value: 'full', label: 'Edit all columns' },
              { value: 'custom', label: 'Choose what to edit' },
            ]}
          />
        </div>
      </div>
      {noReadAccess && (
        <Panel.Error>Select at least one column to view, otherwise the link grants no access.</Panel.Error>
      )}
      <div className={style.twoCols}>
        <div className={style.grid}>
          <Panel.Description>Ontime columns</Panel.Description>
          <Panel.Description>View</Panel.Description>
          <Panel.Description>Edit</Panel.Description>
          {cuesheetDefaultColumns.map(renderColumn)}
        </div>
        {customFieldColumns.length > 0 && (
          <div className={style.grid}>
            <Panel.Description>Custom fields</Panel.Description>
            <Panel.Description>View</Panel.Description>
            <Panel.Description>Edit</Panel.Description>
            {customFieldColumns.map(renderColumn)}
          </div>
        )}
      </div>
    </Panel.Indent>
  );
}
