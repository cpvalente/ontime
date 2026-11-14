const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

function intersectionArea(bounds, area) {
  const width = Math.max(0, Math.min(bounds.x + bounds.width, area.x + area.width) - Math.max(bounds.x, area.x));
  const height = Math.max(0, Math.min(bounds.y + bounds.height, area.y + area.height) - Math.max(bounds.y, area.y));
  return width * height;
}

/** Restore only valid geometry, keeping the entire window on an available display. */
function loadWindowState(filename, displays, primaryDisplay) {
  const primary = primaryDisplay.workArea;
  const width = Math.min(primary.width, Math.max(525, Math.min(1920, Math.round(primary.width * 0.9))));
  const height = Math.min(primary.height, Math.max(405, Math.min(1000, Math.round(primary.height * 0.9))));
  const fallback = {
    bounds: {
      x: primary.x + Math.round((primary.width - width) / 2),
      y: primary.y + Math.round((primary.height - height) / 2),
      width,
      height,
    },
    isMaximized: false,
  };

  let saved;
  try {
    saved = JSON.parse(readFileSync(filename, 'utf8'));
  } catch (_error) {
    return fallback;
  }
  const bounds = saved?.bounds;
  if (
    !bounds ||
    !['x', 'y', 'width', 'height'].every((key) => Number.isSafeInteger(bounds[key])) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return fallback;
  }

  const display = displays.reduce(
    (best, candidate) =>
      intersectionArea(bounds, candidate.workArea) > intersectionArea(bounds, best.workArea) ? candidate : best,
    primaryDisplay,
  );
  const area = display.workArea;
  const restoredWidth = Math.min(area.width, Math.max(525, bounds.width));
  const restoredHeight = Math.min(area.height, Math.max(405, bounds.height));
  return {
    bounds: {
      x: Math.max(area.x, Math.min(bounds.x, area.x + area.width - restoredWidth)),
      y: Math.max(area.y, Math.min(bounds.y, area.y + area.height - restoredHeight)),
      width: restoredWidth,
      height: restoredHeight,
    },
    isMaximized: saved.isMaximized === true,
  };
}

function saveWindowState(filename, state) {
  try {
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, JSON.stringify(state));
    return true;
  } catch (_error) {
    // Window preferences must not block shutdown if the directory is read-only.
    return false;
  }
}

module.exports = { loadWindowState, saveWindowState };
