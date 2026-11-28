import { EndAction, type SettingsPatch, TimeStrategy, TimerType } from 'ontime-types';
import { dayInMs, parsePhaseThresholds, regex, sanitiseAuxTimerNames } from 'ontime-utils';
import { z } from 'zod';

import { validateBody } from '../../middleware/validation.js';

const pinSchema = z
  .string()
  .max(4)
  .regex(regex.isAlphanumericOrEmpty, 'pin can only contain alphanumeric characters')
  .nullable()
  .transform((pin) => pin || null);

const phaseThresholdsSchema = z.unknown().transform((input, context) => {
  const thresholds = parsePhaseThresholds(input);
  if (!thresholds) {
    context.addIssue({ code: 'custom', message: 'phaseThresholds must hold a warning and a danger threshold' });
    return z.NEVER;
  }
  return thresholds;
});

/** Sent whole: a partial set would leave fields undefined on new events */
export const rundownDefaultsSchema = z.object({
  duration: z.number().int().min(0).max(dayInMs),
  linkPrevious: z.boolean(),
  timeStrategy: z.enum(TimeStrategy),
  timerType: z.enum(TimerType),
  endAction: z.enum(EndAction),
  inheritGroupColour: z.boolean(),
});

/** Top-level fields replace the stored ones, nested objects are sent whole */
const settingsPatchSchema = z
  .object({
    editorKey: pinSchema,
    operatorKey: pinSchema,
    timeFormat: z.enum(['12', '24']),
    language: z.string().trim().min(1),
    auxTimerNames: z.array(z.unknown()).transform(sanitiseAuxTimerNames),
    phaseThresholds: phaseThresholdsSchema,
    rundownDefaults: rundownDefaultsSchema,
  })
  .partial()
  .strict() satisfies z.ZodType<SettingsPatch>;

export const validateSettingsPatch = validateBody(settingsPatchSchema);
