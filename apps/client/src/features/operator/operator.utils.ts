import { OntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';

export function getRundownEnd(rundown: OntimeRundown): OntimeEvent | null {
  if (rundown.length < 1) {
    return null;
  }

  for (let i = rundown.length - 1; i > 0; i--) {
    if (rundown[i].type === SupportedEvent.Event) {
      return rundown[i] as OntimeEvent;
    }
  }

  return null;
}
