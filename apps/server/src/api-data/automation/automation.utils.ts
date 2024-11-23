import { FilterRule } from 'ontime-types';

type FilterOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';

export function isFilterOperator(value: string): value is FilterOperator {
  return ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'].includes(value);
}

export function isFilterRule(value: string): value is FilterRule {
  return value === 'all' || value === 'any';
}
