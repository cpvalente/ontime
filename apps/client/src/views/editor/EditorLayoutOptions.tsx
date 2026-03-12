import { memo, useMemo } from 'react';
import { IoCheckmark } from 'react-icons/io5';
import { LuLayoutDashboard } from 'react-icons/lu';

import IconButton from '../../common/components/buttons/IconButton';
import { DropdownMenu, DropdownMenuOption } from '../../common/components/dropdown-menu/DropdownMenu';
import { EditorLayoutMode, useEditorLayout } from './useEditorLayout';

export default memo(EditorLayoutOptions);
function EditorLayoutOptions() {
  const { layoutMode, setLayoutMode } = useEditorLayout();

  const items = useMemo<DropdownMenuOption[]>(
    () => [
      {
        type: 'item',
        label: 'Planning',
        description: 'Edit-focused list with planning stats',
        icon: layoutMode === EditorLayoutMode.PLANNING ? IoCheckmark : undefined,
        onClick: () => setLayoutMode(EditorLayoutMode.PLANNING),
      },
      {
        type: 'item',
        label: 'Tracking',
        description: 'Live timing view with progress and offsets',
        icon: layoutMode === EditorLayoutMode.TRACKING ? IoCheckmark : undefined,
        onClick: () => setLayoutMode(EditorLayoutMode.TRACKING),
      },
      {
        type: 'item',
        label: 'Control',
        description: 'All controls and rundown together',
        icon: layoutMode === EditorLayoutMode.CONTROL ? IoCheckmark : undefined,
        onClick: () => setLayoutMode(EditorLayoutMode.CONTROL),
      },
    ],
    [layoutMode, setLayoutMode],
  );

  return (
    <DropdownMenu render={<IconButton aria-label='Layout mode' variant='subtle-white' size='xlarge' />} items={items}>
      <LuLayoutDashboard />
    </DropdownMenu>
  );
}
