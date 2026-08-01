import { deriveQueryStatus } from '../queryUtils';

test('keeps pending and success statuses unchanged', () => {
  expect(deriveQueryStatus('pending', false)).toBe('pending');
  expect(deriveQueryStatus('success', false)).toBe('success');
});

test('keeps error status on a genuine loading error (no data ever received)', () => {
  expect(deriveQueryStatus('error', true)).toBe('error');
});

test('downgrades error to success on a refetch error (data still available)', () => {
  expect(deriveQueryStatus('error', false)).toBe('success');
});
