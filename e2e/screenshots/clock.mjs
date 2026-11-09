import { readFileSync } from 'node:fs';

// Loaded only by the screenshot server. Leave timers running so HTTP and websockets still work.
const SystemDate = Date;
const clockPath = process.env.ONTIME_SCREENSHOT_CLOCK;
if (!clockPath) throw new Error('The screenshot server requires ONTIME_SCREENSHOT_CLOCK');
const fixedNow = () => Number(readFileSync(clockPath, 'utf8').trim());
if (!Number.isFinite(fixedNow())) throw new Error('Invalid screenshot clock');

globalThis.Date = new Proxy(SystemDate, {
  construct(target, args) {
    return new target(...(args.length ? args : [fixedNow()]));
  },
  apply() {
    return new SystemDate(fixedNow()).toString();
  },
  get(target, property) {
    return property === 'now' ? fixedNow : Reflect.get(target, property);
  },
});
