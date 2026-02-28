import { useSessionStorage } from '@mantine/hooks';
import { EntryId } from 'ontime-types';
import { useCallback, useMemo } from 'react';

/**
 * Keeps track of which groups are collapsed
 * This information is saved in session storage as an array (serializable)
 * but provides Set-like operations for fast lookups
 */
export function useCollapsedGroups(rundownId: string) {
  const [collapsedGroups, setCollapsedGroups] = useSessionStorage<EntryId[]>({
    key: `rundown.${rundownId}-editor-collapsed-groups`,
    defaultValue: [],
  });

  const collapsedGroupSet = useMemo(() => new Set(collapsedGroups), [collapsedGroups]);

  const getIsCollapsed = useCallback(
    (groupId: EntryId): boolean => {
      return collapsedGroupSet.has(groupId);
    },
    [collapsedGroupSet],
  );

  const collapseGroup = useCallback(
    (groupId: EntryId | null | undefined) => {
      if (!groupId) return;
      setCollapsedGroups((prev) => {
        if (prev.includes(groupId)) {
          return prev;
        }
        return [...prev, groupId];
      });
    },
    [setCollapsedGroups],
  );

  const expandGroup = useCallback(
    (groupId: EntryId | null | undefined) => {
      if (!groupId) return;
      setCollapsedGroups((prev) => prev.filter((id) => id !== groupId));
    },
    [setCollapsedGroups],
  );

  return { getIsCollapsed, collapseGroup, expandGroup };
}
