import { ShowRunSummary } from 'ontime-types';
import { KeyboardEvent, useState } from 'react';
import { IoCheckmark, IoClose, IoPencil, IoTrash } from 'react-icons/io5';

import { deleteRun, renameRun } from '../../../../../common/api/report';
import { maybeAxiosError } from '../../../../../common/api/utils';
import IconButton from '../../../../../common/components/buttons/IconButton';
import Input from '../../../../../common/components/input/input/Input';
import Tag from '../../../../../common/components/tag/Tag';
import useRuns from '../../../../../common/hooks-query/useRuns';
import { preventEscape } from '../../../../../common/utils/keyEvent';
import { cx } from '../../../../../common/utils/styleUtils';
import * as Panel from '../../../panel-utils/PanelUtils';
import { formatDrift } from '../reportSettings.utils';

import style from './RunsList.module.scss';

interface RunsListProps {
  runs: ShowRunSummary[];
  rundownId?: string;
  selectedRunId: string | null;
  onSelect: (id: string) => void;
}

export default function RunsList({ runs, rundownId, selectedRunId, onSelect }: RunsListProps) {
  const { refetch } = useRuns(rundownId);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startRename = (run: ShowRunSummary) => {
    setRenamingId(run.id);
    setRenameValue(run.label);
  };

  const submitRename = async (id: string) => {
    const label = renameValue.trim();
    setRenamingId(null);
    if (label.length === 0) {
      return;
    }
    try {
      setError(null);
      await renameRun(id, label);
    } catch (renameError) {
      setError(maybeAxiosError(renameError));
    } finally {
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteRun(id);
      if (id === selectedRunId) {
        const next = runs.find((run) => run.id !== id);
        if (next) onSelect(next.id);
      }
    } catch (deleteError) {
      setError(maybeAxiosError(deleteError));
    } finally {
      refetch();
    }
  };

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>, id: string) => {
    preventEscape(event, () => setRenamingId(null));
    if (event.key === 'Enter') {
      event.preventDefault();
      submitRename(id);
    }
  };

  return (
    <Panel.Section>
      <Panel.Table>
        <thead>
          <tr>
            <th>Run</th>
            <th>Rundown</th>
            <th>Started</th>
            <th>Drift</th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {runs.length === 0 && (
            <Panel.TableEmpty
              title='No runs yet'
              description='A run is created the first time an event is started, and is added to history once playback stops.'
            />
          )}
          {runs.map((run) => {
            const isSelected = run.id === selectedRunId;
            const isRenaming = renamingId === run.id;
            return (
              <tr
                key={run.id}
                className={cx([style.row, isSelected && style.current])}
                onClick={() => onSelect(run.id)}
              >
                <td>
                  {isRenaming ? (
                    <Panel.InlineElements relation='inner' onClick={(event) => event.stopPropagation()}>
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onKeyDown={(event) => handleRenameKeyDown(event, run.id)}
                      />
                      <IconButton aria-label='Save name' variant='ghosted-white' onClick={() => submitRename(run.id)}>
                        <IoCheckmark />
                      </IconButton>
                      <IconButton
                        aria-label='Cancel rename'
                        variant='ghosted-white'
                        onClick={() => setRenamingId(null)}
                      >
                        <IoClose />
                      </IconButton>
                    </Panel.InlineElements>
                  ) : (
                    run.label
                  )}
                </td>
                <td>{run.rundownTitle}</td>
                <td>{new Date(run.startedAt).toLocaleString()}</td>
                <td>{formatDrift(run.summary.drift, run.summary.eventsRun)}</td>
                <td>{run.endedAt === null && <Tag variant='active'>Ongoing</Tag>}</td>
                <Panel.InlineElements align='end' relation='inner' as='td' onClick={(event) => event.stopPropagation()}>
                  {!isRenaming && (
                    <>
                      <IconButton aria-label='Rename run' variant='ghosted-white' onClick={() => startRename(run)}>
                        <IoPencil />
                      </IconButton>
                      <IconButton
                        aria-label='Delete run'
                        variant='ghosted-destructive'
                        onClick={() => handleDelete(run.id)}
                      >
                        <IoTrash />
                      </IconButton>
                    </>
                  )}
                </Panel.InlineElements>
              </tr>
            );
          })}
        </tbody>
      </Panel.Table>
      {error && <Panel.Error>{error}</Panel.Error>}
    </Panel.Section>
  );
}
