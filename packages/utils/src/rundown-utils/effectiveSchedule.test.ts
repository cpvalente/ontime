import type { EffectiveScheduleItem } from './effectiveSchedule';
import { calculateEffectiveSchedule, calculatePropagationUntilGap } from './effectiveSchedule';

function makeItems(): EffectiveScheduleItem[] {
  return [
    { timeStart: 0, timeEnd: 600_000, baseDelay: 0 }, // 10m
    { timeStart: 600_000, timeEnd: 1_200_000, baseDelay: 0 }, // 10m
    { timeStart: 1_200_000, timeEnd: 1_800_000, baseDelay: 0 }, // 10m
  ];
}

describe('calculatePropagationUntilGap', () => {
  test('propagates delay to the end when no gaps exist', () => {
    const result = calculatePropagationUntilGap(makeItems(), 0, 120_000);
    expect(result).toEqual([120_000, 120_000, 120_000]);
  });

  test('absorbs delay in later gaps', () => {
    const items: EffectiveScheduleItem[] = [
      { timeStart: 0, timeEnd: 600_000 }, // 10m
      { timeStart: 900_000, timeEnd: 1_200_000 }, // 5m gap before this starts
      { timeStart: 1_200_000, timeEnd: 1_800_000 },
    ];

    const result = calculatePropagationUntilGap(items, 0, 120_000);
    expect(result).toEqual([120_000, 0, 0]);
  });

  test('negative delay is absorbed in positive gaps', () => {
    const items: EffectiveScheduleItem[] = [
      { timeStart: 0, timeEnd: 600_000 },
      { timeStart: 720_000, timeEnd: 1_200_000 }, // 2m gap
      { timeStart: 1_320_000, timeEnd: 1_800_000 }, // 2m gap
    ];

    const result = calculatePropagationUntilGap(items, 0, -180_000);
    expect(result).toEqual([-180_000, -60_000, 0]);
  });

  test('supports multiple sequential adjustments by summing delays', () => {
    const items = makeItems();
    const first = calculatePropagationUntilGap(items, 0, 120_000);
    const second = calculatePropagationUntilGap(items, 0, 60_000);

    const combined = first.map((value, index) => value + second[index]);
    expect(combined).toEqual([180_000, 180_000, 180_000]);
  });

  test('jump behavior recomputes from new active index', () => {
    const items: EffectiveScheduleItem[] = [
      { timeStart: 0, timeEnd: 600_000 },
      { timeStart: 780_000, timeEnd: 1_200_000 }, // 3m gap
      { timeStart: 1_500_000, timeEnd: 1_800_000 }, // 5m gap
    ];

    const fromFirst = calculatePropagationUntilGap(items, 0, 240_000); // +4m
    expect(fromFirst).toEqual([240_000, 60_000, 0]);

    const fromSecond = calculatePropagationUntilGap(items, 1, 60_000);
    expect(fromSecond).toEqual([0, 60_000, 0]);
  });
});

describe('calculateEffectiveSchedule', () => {
  test('returns effective start and end values', () => {
    const result = calculateEffectiveSchedule(makeItems(), 0, 120_000);
    expect(result[0]).toEqual({
      delayAtThisPoint: 120_000,
      effectiveStart: 120_000,
      effectiveEnd: 720_000,
    });
  });
});
