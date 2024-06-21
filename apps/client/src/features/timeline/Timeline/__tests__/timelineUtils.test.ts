import { dayInMs } from 'ontime-utils';

import { getElementPosition, getLaneLevel } from '../timelineUtils';

describe('getCSSPosition()', () => {
  it('accounts for rundown with one event', () => {
    const scheduleStart = 0;
    const scheduleEnd = dayInMs;
    const eventStart = 0;
    const eventDuration = dayInMs;
    const containerWidth = 100;

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(0);
    expect(result.width).toBe(containerWidth);
  });

  it('accounts for an event that starts halfway and ends at end', () => {
    const scheduleStart = 0;
    const scheduleEnd = 100;
    const eventStart = 50;
    const eventDuration = 50;
    const containerWidth = 100;

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(50);
    expect(result.width).toBe(50);
  });

  it('accounts for an event that starts first and ends halfway', () => {
    const scheduleStart = 0;
    const scheduleEnd = 100;
    const eventStart = 0;
    const eventDuration = 50;
    const containerWidth = 100;

    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(0);
    expect(result.width).toBe(50);
  });

  it('accounts for an event that is in the middle of the rundown', () => {
    const scheduleStart = 7;
    const scheduleEnd = 23;
    const eventStart = 10;
    const eventDuration = 1;
    const containerWidth = 1000;

    // 16 hour event, this gives 62.5px per hour
    const result = getElementPosition(scheduleStart, scheduleEnd, eventStart, eventDuration, containerWidth);
    expect(result.left).toBe(187.5); // 3 * 62.5
    expect(result.width).toBe(62.5);
  });
});

describe('getLaneLevel()', () => {
  it('should place in lane 0 if there is no overlap', () => {
    const rightMostElements = { 0: 50 };
    const left = 60;
    const result = getLaneLevel(rightMostElements, left);
    expect(result).toBe(0);
  });

  it('should place in next available lane if there is overlap', () => {
    const rightMostElements = { 0: 150, 1: 100 };
    const left = 120;
    const result = getLaneLevel(rightMostElements, left);
    expect(result).toBe(1);
  });

  it('should create a new lane if all existing lanes are overlapped', () => {
    const rightMostElements = { 0: 200, 1: 250 };
    const left = 150;
    const result = getLaneLevel(rightMostElements, left);
    expect(result).toBe(2);
  });

  it('should place in lane 0 if it is the first event', () => {
    const rightMostElements = {};
    const left = 0;
    const result = getLaneLevel(rightMostElements, left);
    expect(result).toBe(0);
  });
});
