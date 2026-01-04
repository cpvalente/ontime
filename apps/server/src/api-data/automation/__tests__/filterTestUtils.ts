import { AutomationFilter, PlayableEvent } from 'ontime-types';
import { RuntimeState } from '../../../stores/runtimeState.js';
import { makeRuntimeStateData } from '../../../stores/__mocks__/runtimeState.mocks.js';
import { testConditions } from '../automation.service.js';

type FieldCategories = 'number' | 'string' | 'boolean' | 'null/undefined';
type FieldCategoriesTypeMap = {
  number: number;
  string: string;
  boolean: boolean;
  'null/undefined': null;
};

export function runTestCondition<T extends FieldCategories>(
  stateType: T,
  stateValue: FieldCategoriesTypeMap[T],
  operator: AutomationFilter['operator'],
  value: string,
) {
  const { state, field } = getFilterState(stateType, stateValue);
  const mockStore = makeRuntimeStateData(state);
  const filter: AutomationFilter = {
    field,
    operator,
    value,
  };
  return testConditions([filter], 'all', mockStore);
}

export function getFilterState<T extends FieldCategories>(
  stateType: T,
  stateValue: FieldCategoriesTypeMap[T],
): { state: Partial<RuntimeState>; field: string } {
  switch (stateType) {
    case 'number':
      return {
        state: { clock: stateValue as number },
        field: 'clock',
      };
    case 'string':
      return {
        state: {
          eventNow: {
            title: stateValue as string,
          } as PlayableEvent,
        },
        field: 'eventNow.title',
      };
    case 'boolean':
      return {
        state: { eventNow: { countToEnd: stateValue as boolean } as PlayableEvent },
        field: 'eventNow.countToEnd',
      };
    case 'null/undefined':
    default:
      return {
        state: { eventNow: null },
        field: 'eventNow.title',
      };
  }
}
