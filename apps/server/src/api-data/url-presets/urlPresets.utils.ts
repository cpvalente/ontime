import type { URLPreset } from 'ontime-types';

/** Lowercase aliases, preserving colliding presets under unique names. */
export function normaliseUrlPresets(presets: URLPreset[]): URLPreset[] {
  // Reserve original names so generated suffixes never displace another preset.
  const aliases = presets.map((preset) => preset.alias.toLowerCase());
  const reserved = new Set(aliases);
  const used = new Set<string>();

  return presets.map((preset, index) => {
    const baseAlias = aliases[index];
    let alias = baseAlias;
    let suffix = 2;
    if (used.has(alias)) {
      while (reserved.has(`${baseAlias}-${suffix}`)) suffix++;
      alias = `${baseAlias}-${suffix}`;
      reserved.add(alias);
    }
    used.add(alias);
    return { ...preset, alias };
  });
}
