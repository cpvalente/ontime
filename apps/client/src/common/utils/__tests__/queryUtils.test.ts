import { deriveQueryStatus } from '../queryUtils';

test('keeps pending and success statuses unchanged', () => {
  expect(deriveQueryStatus('pending', undefined)).toBe('pending');
  expect(deriveQueryStatus('success', { some: 'data' })).toBe('success');
});

test('keeps error status when there is no data', () => {
  expect(deriveQueryStatus('error', undefined)).toBe('error');
});

test('downgrades error to success when data is still available', () => {
  expect(deriveQueryStatus('error', { some: 'data' })).toBe('success');
  expect(deriveQueryStatus('error', [])).toBe('success');
  expect(deriveQueryStatus('error', 0)).toBe('success');
});
