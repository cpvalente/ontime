# Implementation Plan: Enhanced Rundown Keyboard Shortcuts

This document outlines the plan to extend the keyboard shortcuts for the Rundown feature, including functionality for Duplicate, Delete, Cut, and improved navigation (Home/End, PageUp/PageDown).

## Files to Modify

1.  `apps/client/src/features/rundown/hooks/useRundownCommands.ts`
2.  `apps/client/src/features/rundown/hooks/useRundownKeyboard.ts`

## Step 1: Logic Implementation (`useRundownCommands.ts`)

We need to add the underlying logic for the new actions.

### 1. `cloneEntry`
Create a function to clone the currently selected entry.
*   **Action**: Use `entryActions.clone`.
*   **Logic**:
    *   If no cursor, return.
    *   Call `clone(cursor, { after: cursor })`.

### 2. `selectEdge`
Create a function to jump to the top or bottom of the list.
*   **Arguments**: `direction: 'top' | 'bottom'`.
*   **Logic**:
    *   Use `getFirstNormal(entries, order)` for `'top'`.
    *   Use `getLastNormal(entries, order)` for `'bottom'`.
    *   Call `setSelectedEvents` with the result.

### 3. `selectPage`
Create a function to move selection by a "page" (e.g., 10 items).
*   **Arguments**: `cursor: string | null`, `direction: 'up' | 'down'`.
*   **Constant**: `PAGE_SIZE = 10`.
*   **Logic**:
    *   Use `getNextNormal` / `getPreviousNormal` in a loop (up to `PAGE_SIZE` times) to find the target entry.
    *   Call `setSelectedEvents` with the result.

### 4. `cutEntry`
While "Cut" is often a compound action in the keyboard hook (Copy + Delete), implementing a helper here allows for cleaner handling if additional logic is needed later.
*   **Logic**:
    *   Set copy ID (requires access to `entryCopyStore` or passed via props, but current pattern passes `setEntryCopyId` to `useRundownKeyboard` separately).
    *   *Note*: Since `setEntryCopyId` is separate, we can handle "Cut" composition in `useRundownKeyboard.ts` or add a `cut` command here that combines them if we bring `setEntryCopyId` into commands. *Recommendation: Handle composition in `useRundownKeyboard.ts` to matching existing patterns, or add a specific `cutEntry` if complex.*

**Update Return Interface**: Ensure `selectEdge`, `selectPage`, and `cloneEntry` are returned from the hook.

## Step 2: Keyboard Mapping (`useRundownKeyboard.ts`)

Update the `UseRundownKeyboardOptions` interface and the `useHotkeys` hook configuration.

### 1. Update Interface
Update `UseRundownKeyboardOptions['commands']` to include:
```typescript
interface UseRundownKeyboardOptions {
  // ... existing
  commands: {
    // ... existing
    cloneEntry: (cursor: EntryId | null) => void;
    selectEdge: (direction: 'top' | 'bottom') => void;
    selectPage: (cursor: EntryId | null, direction: 'up' | 'down') => void;
  };
  // ... existing
}
```

### 2. Add Hotkeys implementation

Add the following mappings to the `useHotkeys` array:
*   **Note**: `mod + D` (Clone) does not collide with `alt + D` (Add Delay).

| Action | Shortcut | Handler Logic |
| :--- | :--- | :--- |
| **Clone** | `mod + D` | `commands.cloneEntry(cursor)` |
| **Delete** | `mod + Delete` | `commands.deleteAtCursor(cursor)` |
| **Cut** | `mod + X` | `() => { setEntryCopyId(cursor); commands.deleteAtCursor(cursor); }` |
| **Home** | `Home` | `commands.selectEdge('top')` |
| **End** | `End` | `commands.selectEdge('bottom')` |
| **Page Up** | `PageUp` | `commands.selectPage(cursor, 'up')` |
| **Page Down** | `PageDown` | `commands.selectPage(cursor, 'down')` |

*Note*: Ensure `{ preventDefault: true, usePhysicalKeys: true }` is used for navigation keys to prevent browser scrolling.
## Step 3: UI Updates for Discoverability

To ensure users can discover these new features, we must update the UI to reflect new shortcuts.

### 1. Update Context Menus
Add "Clone" and "Delete" options (or ensure they use the new keyboard shortcuts in their labels) to the context menus of rundown items.

**Files to Modify**:
*   `apps/client/src/features/rundown/rundown-event/RundownEvent.tsx`
*   `apps/client/src/features/rundown/rundown-group/RundownGroup.tsx`
*   `apps/client/src/features/rundown/rundown-milestone/RundownMilestone.tsx`

**Changes**:
*   Locate `useContextMenu` implementation.
*   Add/Update `Clone` option with shortcut label `Mod+D`.
*   Ensure `Delete` option shows correct `Mod/Del` shortcut.

### 2. Update Empty State Shortcuts
Update the shortcut list displayed when no event is selected.

**File to Modify**:
*   `apps/client/src/features/rundown/entry-editor/EventEditorEmpty.tsx`

**Changes**:
*   Add rows to the shortcut table for:
    *   **Clone Entry**: `Mod + D`
    *   **Delete Entry**: `Mod + Delete` / `Delete`
    *   **Navigation**: `Home`, `End`, `PgUp`, `PgDn` (Group under "Navigation")

## Step 4: UX Review & Interface Improvements

### 1. `EventEditorEmpty` Redesign
The current table-based layout is rigid. We will refactor `apps/client/src/features/rundown/entry-editor/EventEditorEmpty.tsx` to use a sleek CSS Grid layout.
*   **Action**: Replace `<table>` with `div` based grid.
*   **Visuals**: Use subtle headers for groups (Navigation, Editing, System).
*   **Refinement**: Ensure `<Kbd>` components use a flat, minimal design.

### 2. Global Shortcuts Dialog
*   **Decision**: Implement a Global Shortcuts Dialog triggered by `?` (Shift + /).
*   **Rationale**: Users lose the `EventEditorEmpty` reference once they add content. A persistent dialog ensures "recognition over recall".

### 3. Context Menu Implementation Guide
We will enhance the context menu to display shortcuts inline.

**A. Update Type Definition**
Modify `apps/client/src/common/components/dropdown-menu/DropdownMenu.tsx`:
```typescript
type DropdownMenuItem = {
  // ... existing fields
  shortcut?: string; // New field
};
```

**B. Update Component Rendering**
In `apps/client/src/common/components/dropdown-menu/DropdownMenu.tsx`, update the render loop to display the shortcut:
```tsx
<BaseMenu.Item className={style.item}>
   <span className={style.labelContainer}>
      {item.icon && <item.icon />}
      {item.label}
   </span>
   {item.type === 'item' && item.shortcut && (
      <span className={style.shortcut}>{item.shortcut}</span>
   )}
</BaseMenu.Item>
```
*Note*: Update `DropdownMenu.module.scss` to use `justify-content: space-between` on the item.

**C. Update Usage in `RundownEvent.tsx`**
Add shortcuts to the context menu options:
```tsx
{
  type: 'item',
  label: 'Clone',
  icon: IoDuplicateOutline,
  shortcut: `${deviceMod}+D`, 
  onClick: () => clone(eventId, { after: eventId }),
},
{
  type: 'item',
  label: 'Delete',
  icon: IoTrash,
  shortcut: 'Del',
  onClick: () => { /* ... */ },
}
```
