import { PropsWithChildren, ReactNode } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { Popover } from '@base-ui-components/react/popover';
import { useSessionStorage } from '@mantine/hooks';
import { ErrorBoundary } from '@sentry/react';

import IconButton from '../../common/components/buttons/IconButton';
import Checkbox from '../../common/components/checkbox/Checkbox';
import * as Editor from '../../common/components/editor-utils/EditorUtils';
import PopoverContents from '../../common/components/popover/Popover';
import { useIsOnline } from '../../common/hooks/useSocket';
import { cx } from '../../common/utils/styleUtils';

import style from './Overview.module.scss';

interface OverviewWrapperProps {
  navElements: ReactNode;
}

export function OverviewWrapper({ navElements, children }: PropsWithChildren<OverviewWrapperProps>) {
  const { isOnline } = useIsOnline();
  return (
    <div className={cx([style.overview, !isOnline && style.isOffline])}>
      <ErrorBoundary>
        <OverviewSettings />
        <div className={style.nav}>{navElements}</div>
        <div className={style.info}>{children}</div>
      </ErrorBoundary>
    </div>
  );
}

function OverviewSettings() {
  const [overviewSettings, setOverviewSettings] = useSessionStorage({
    key: 'overviewSettings',
    defaultValue: {
      showScheduleTimes: true,
      showProgress: true,
      showOverUnder: true,
      showTimeToGroupEnd: true,
      showTimeToFlag: true,
      showTimeNow: true,
      timeMode: 'all',
    },
  });

  return (
    <div className={style.floatingActions}>
      <Popover.Root>
        <Popover.Trigger
          render={
            <IconButton size='medium' variant='ghosted-white'>
              <IoSettingsOutline />
            </IconButton>
          }
        />
        <PopoverContents align='end' className={style.popover}>
          <div className={style.column}>
            <Editor.Label className={style.sectionTitle}>Element visibility</Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.showScheduleTimes}
                onCheckedChange={(value) => setOverviewSettings({ ...overviewSettings, showScheduleTimes: value })}
              />
              Schedule times
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.showProgress}
                onCheckedChange={(value) => setOverviewSettings({ ...overviewSettings, showProgress: value })}
              />
              Progress
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.showOverUnder}
                onCheckedChange={(value) => setOverviewSettings({ ...overviewSettings, showOverUnder: value })}
              />
              Over Under
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.showTimeToGroupEnd}
                onCheckedChange={(value) => setOverviewSettings({ ...overviewSettings, showTimeToGroupEnd: value })}
              />
              Time to group end
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.showTimeToFlag}
                onCheckedChange={(value) => setOverviewSettings({ ...overviewSettings, showTimeToFlag: value })}
              />
              Time to flag
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.showTimeNow}
                onCheckedChange={(value) => setOverviewSettings({ ...overviewSettings, showTimeNow: value })}
              />
              Time now
            </Editor.Label>
          </div>

          <Editor.Separator orientation='vertical' />

          <div className={style.column}>
            <Editor.Label className={style.sectionTitle}>Time mode</Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.timeMode === 'all'}
                onCheckedChange={() => setOverviewSettings({ ...overviewSettings, timeMode: 'all' })}
              />
              Show all times
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.timeMode === 'planned'}
                onCheckedChange={() => setOverviewSettings({ ...overviewSettings, timeMode: 'planned' })}
              />
              Show planned times
            </Editor.Label>
            <Editor.Label className={style.inline}>
              <Checkbox
                checked={overviewSettings.timeMode === 'expected'}
                onCheckedChange={() => setOverviewSettings({ ...overviewSettings, timeMode: 'expected' })}
              />
              Show expected times
            </Editor.Label>
          </div>
        </PopoverContents>
      </Popover.Root>
    </div>
  );
}
