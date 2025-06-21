import { clamp } from '../math';

test('Clamps a set of numbers correctly', () => {
  const testCases = [
    { num: 10, min: 0, max: 20, result: 10 },
    { num: 0, min: 0, max: 20, result: 0 },
    { num: 20, min: 0, max: 20, result: 20 },
    { num: 20, min: 0, max: 20, result: 20 },
    { num: -20, min: 0, max: 20, result: 0 },
    { num: -0, min: 0, max: 20, result: 0 },
    { num: -50, min: -30, max: -20, result: -30 },
    { num: -50, min: 0, max: 0, result: 0 },
    { num: 50.5, min: 0, max: 100, result: 50.5 },
    { num: 50, min: 0, max: 20.32, result: 20.32 },
    { num: 10, min: 20.32, max: 40, result: 20.32 },
  ];

  testCases.forEach((t) => expect(clamp(t.num, t.min, t.max)).toBe(t.result));
});
